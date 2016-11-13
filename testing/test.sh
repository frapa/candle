if [ -f ./app ]
then
    rm ./app
fi

go build github.com/frapa/candle/app
#cp db.backup db.sqlite

if [ -f ./app ]
then
    ./app
fi
