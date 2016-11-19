package kernel

/* Takes care of searching and reading the database.
 */

import (
	"fmt"
	"github.com/rs/xid"
	"reflect"
	"strings"
	"time"
)

const (
	ATTR    = 99
	AND     = 100
	OR      = 101
	ASC     = 102
	DESC    = 103
	ISO8601 = "2006-01-02 15:04:05.000"
)

// FILTER -----------------------------------------------------------
type filter struct {
	type_      int
	column     string
	operator   string
	value      string
	subFilters []filter
}

// for internal usage
func newParentFilter(filters []filter, type_ int) filter {
	f := *new(filter)
	f.type_ = type_

	for _, sf := range filters {
		f.subFilters = append(f.subFilters, sf)
	}

	return f
}

func F(column string, operator string, value string) filter {
	f := *new(filter)
	f.type_ = ATTR
	f.column = column
	f.operator = operator
	f.value = value
	return f
}

func And(filters ...filter) filter {
	return newParentFilter(filters, AND)
}

func Or(filters ...filter) filter {
	return newParentFilter(filters, OR)
}

func (f filter) Clone() filter {
	fCopy := *new(filter)

	fCopy.type_ = f.type_
	fCopy.column = f.column
	fCopy.operator = f.operator
	fCopy.value = f.value

	for _, sf := range f.subFilters {
		fCopy.subFilters = append(fCopy.subFilters, sf.Clone())
	}

	return fCopy
}

func (f *filter) computeSql() (string, []interface{}) {
	if f.type_ == ATTR {
		return f.column + " " + f.operator + " ?", []interface{}{f.value}
	} else if f.type_ == AND || f.type_ == OR {
		var filters []string
		var values []interface{}
		for _, f := range f.subFilters {
			fsql, vals := f.computeSql()
			filters = append(filters, "("+fsql+")")
			values = append(values, vals...)
		}

		op := " OR "
		if f.type_ == AND {
			op = " AND "
		}

		return strings.Join(filters, op), values
	}
	return "", nil // stupid go
}

// ORDER -----------------------------------------------------------
type order struct {
	column    string
	direction int
}

// QUERY -----------------------------------------------------------
type query struct {
	tableName     string
	filter        filter
	limit         uint
	offset        int
	order         order
	current       int
	rows          []map[string]interface{}
	rowNum        int
	subQuery      *query // used for joins
	joinQuery     bool
	linkQuery     bool
	subId         string
	subAttr       string
	dataRetrieved bool
}

/* Get data from database. The name is all because it
 * stands for "get all objects of type_ modelName".
 * Example use:
 *
 * var u User
 * All("User").Filter("username", "=", username).Get(&u)
 * if u.PswHash === password { ...
 *
 * As you see you are getting all user and then filter
 * the username to get only the one you want.
 * Compare this with running your own SQL (not so difficult)
 * And than filling manually your struct (boring).
 */
func All(modelName string) *query {
	q := new(query)
	q.tableName = modelName
	q.current = -1
	q.offset = -1
	return q
}

func (q *query) Clone() *query {
	qCopy := All(q.tableName)

	qCopy.limit = q.limit
	qCopy.offset = q.offset
	qCopy.current = q.current
	qCopy.order = order{q.order.column, q.order.direction}
	qCopy.filter = q.filter.Clone()
	qCopy.subId = q.subId
	qCopy.subAttr = q.subAttr

	if q.subQuery != nil {
		qCopy.subQuery = q.subQuery.Clone()
	}

	return qCopy
}

func (q *query) Filter(data ...interface{}) *query {
	nq := q.Clone()

	if len(data) == 0 {
		panic("Filter requires at least one argument.")
	}

	typeName := reflect.ValueOf(data[0]).Type().Name()
	if typeName == "string" {
		if len(data) < 3 {
			panic("Filter requires <column>, <operator> and <value> as arguments.")
		}

		nq.filter = F(data[0].(string), data[1].(string), data[2].(string))
	} else if typeName == "filter" {
		nq.filter = data[0].(filter)
	}

	return nq
}

func (q *query) Limit(limit uint) *query {
	nq := q.Clone()
	nq.limit = limit
	return nq
}

func (q *query) Offset(offset int) *query {
	nq := q.Clone()
	nq.offset = offset
	return nq
}

func (q *query) OrderBy(column string, direction_ ...int) *query {
	nq := q.Clone()

	direction := ASC
	if len(direction_) > 0 {
		direction = direction_[0]
	}

	nq.order = order{column, direction}
	return nq
}

func (q *query) To(attr string) *query {
	link := GetLinkInfo(q.tableName, attr)
	targetClass := link.Target

	nq := All(targetClass)
	nq.subQuery = q.Clone()
	nq.subAttr = attr

	// Check if we are in a loop. In that case we have to return
	// a completely new query connected with the current object
	if q.current != -1 {
		nq.subId = q.rows[q.current]["Id"].(string)
		nq.linkQuery = true
	} else {
		nq.joinQuery = true
	}

	return nq
}

func (q *query) computeQuery() (string, []interface{}) {
	var args []interface{}

	filters := ""
	if q.filter.type_ != 0 {
		fsql, vals := q.filter.computeSql()
		filters = " WHERE " + fsql
		args = append(args, vals...)
	}

	orderLimitOffset := ""
	if q.order.column != "" {
		orderLimitOffset += " ORDER BY " + q.order.column
		if q.order.direction == ASC {
			orderLimitOffset += " ASC"
		} else {
			orderLimitOffset += " DESC"
		}
	}
	if q.limit != 0 {
		orderLimitOffset += " LIMIT " + fmt.Sprintf("%v", q.limit)
	}
	if q.offset != -1 {
		orderLimitOffset += " OFFSET " + fmt.Sprintf("%v", q.offset)
	}

	var sql string
	if q.joinQuery {
		subQ := q.subQuery
		subSql, subArgs := subQ.computeQuery()
		tempTableName := "tab" + xid.New().String()
		sql = "SELECT " + q.tableName + ".* FROM (" + subSql + ") AS " + tempTableName +
			" INNER JOIN _Links ON _Links.OriginId=" + tempTableName + ".Id AND " +
			"_Links.OriginClass='" + subQ.tableName + "' AND _Links.TargetClass='" + q.tableName +
			" AND _Links.Attr='" + q.subAttr + "' INNER JOIN " +
			q.tableName + " ON _Links.TargetId=" + q.tableName + ".Id" + filters + orderLimitOffset + ";"
		args = append(subArgs, args)
	} else if q.linkQuery {
		subQ := q.subQuery
		sql = "SELECT " + q.tableName + ".* FROM _Links INNER JOIN " + q.tableName +
			" ON _Links.OriginClass='" + subQ.tableName + "' AND _Links.OriginId='" + subQ.subId + "'.Id " +
			" AND _Links.TargetClass='" + q.tableName + "' AND _Links.TargetId=" + q.tableName + ".Id " +
			" AND _Links.Attr='" + q.subAttr + "'"
	} else {
		sql = "SELECT * FROM " + q.tableName + filters + orderLimitOffset + ";"
	}

	return sql, args
}

func (q *query) Next() bool {
	if !q.dataRetrieved {
		err := q.retrieveData()
		if err != nil {
			panic(err)
		}
	}

	q.current += 1
	if q.rowNum > q.current {
		return true
	} else {
		return false
	}
}

func (q *query) Count() int {
	if !q.dataRetrieved {
		err := q.retrieveData()
		if err != nil {
			panic(err)
		}
	}

	return q.rowNum
}

func (q *query) Current() int {
	return q.current
}

/* This is really magic. "Lasciate ogni speranza o voi che entrate"
 */
func (q *query) retrieveData() error {
	sql, args := q.computeQuery()

	//fmt.Println(sql, args)
	rows, err := GetDb().Query(sql, args...)
	if err != nil {
		return err
	}

	// get number of columns
	cols, err := rows.Columns()
	if err != nil {
		return err
	}

	ncols := len(cols)
	for rows.Next() {
		// This is just a way to read the columns without knowing the type
		fields := make([]interface{}, ncols)
		fieldPtrs := make([]interface{}, ncols)

		for i, _ := range fields {
			fieldPtrs[i] = &fields[i]
		}

		err := rows.Scan(fieldPtrs...)
		if err != nil {
			return err
		}

		row := make(map[string]interface{})
		for i, col := range cols {
			row[col] = fields[i]
		}
		q.rows = append(q.rows, row)
		q.rowNum += 1
	}

	if err := rows.Err(); err != nil {
		return err
	}

	q.dataRetrieved = true
	return nil
}

func setStructFields(str interface{}, row map[string]interface{}) {
	elem := reflect.ValueOf(str).Elem()
	elemType := elem.Type()

	for i := 0; i < elemType.NumField(); i++ {
		field := elemType.Field(i)
		if field.Anonymous {
			setStructFields(elem.Field(i).Addr().Interface(), row)
			continue
		}

		fieldValue := elem.Field(i)
		fieldName := field.Name
		type_ := field.Type.Name()
		tag := field.Tag

		if tag == "nodb" {
			if fieldName == "Persisted" {
				fieldValue.SetBool(true)
			}
		} else {
			/* This is probably the most magic of all magic,
			 * It gets a reflect.Value, which can be almost anything,
			 * but in this case it should be a struct field and sets
			 * a value of unknown type :-)
			 */
			iValue := row[fieldName]
			value := reflect.ValueOf(iValue)
			if type_ == "string" {
				value = reflect.ValueOf(fmt.Sprintf("%s", iValue))
			} else if type_ == "Time" {
				time_, err := time.Parse(ISO8601,
					fmt.Sprintf("%s", iValue))
				if err != nil {
					// It means the field is empty or nil - invalid or no date
					value = reflect.ValueOf(time.Time{})
				} else {
					value = reflect.ValueOf(time_)
				}
			}

			fieldValue.Set(value)
		}
	}
}

func (q *query) Get(str interface{}) {
	nq := q
	if q.current == -1 {
		nq = q.Limit(1)
		nq.Next()
	}

	if nq.current >= nq.rowNum {
		fmt.Println("WARNING: trying to get non-existant object")
		return
	}

	row := nq.rows[nq.current]
	setStructFields(str, row)
}
