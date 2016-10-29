package kernel

/* Takes care of searching and reading the database.
 */

import (
	"fmt"
	"reflect"
	"strings"
	"time"
)

const (
	ATTR    = 99
	AND     = 100
	OR      = 101
	INC     = 102
	DEC     = 103
	ISO8601 = "2006-01-02 15:04:05"
)

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
	f.type_ = AND

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

type order struct {
	column    string
	direction int
}

type query struct {
	tableName string
	filter    filter
	limit     uint
	offset    uint
	order     order
	executed  bool
	current   int
	rows      []map[string]interface{}
	rowNum    int
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
	return q
}

func (q *query) Filter(data ...interface{}) *query {
	if len(data) == 0 {
		panic("Filter requires at least one argument.")
	}

	typeName := reflect.ValueOf(data[0]).Type().Name()
	if typeName == "string" {
		if len(data) < 3 {
			panic("Filter requires <column>, <operator> and <value> as arguments.")
		}

		q.filter = F(data[0].(string), data[1].(string), data[2].(string))
	} else if typeName == "filter" {
		q.filter = data[0].(filter)
	}

	return q
}

func (q *query) computeQuery() (string, []interface{}) {
	var args []interface{}

	filters := ""
	if q.filter.type_ != 0 {
		fsql, vals := q.filter.computeSql()
		filters = " WHERE " + fsql
		args = append(args, vals...)
	}

	sql := "SELECT * FROM " + q.tableName + filters + ";"

	return sql, args
}

func (q *query) Next() bool {
	if q.current == -1 {
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
				time, err := time.Parse(ISO8601,
					fmt.Sprintf("%s", iValue))
				if err != nil {
					panic(err)
				}
				value = reflect.ValueOf(time)
			}

			fieldValue.Set(value)
		}
	}
}

func (q *query) Get(str interface{}) {
	if q.current == -1 {
		q.Next()
	}

	if q.current >= q.rowNum {
		fmt.Println("WARNING: trying to get non-existant model")
		return
	}

	row := q.rows[q.current]
	setStructFields(str, row)
}
