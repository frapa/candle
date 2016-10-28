rm app
go build github.com/frapa/candle/app
cp db.backup db.sqlite
./app