HOST=root@164.132.108.1
APP=$(basename $(dirname $PWD))

if [ -z "$1" ]
then
    echo "Usage: deploy.sh VERSION_NUMBER"
    echo "VERSION_NUMBER should be something like 0.1.0"
    exit
fi

# compile
if [ ! -z "$1" ]
then
    echo "Building project..."
    compile.sh nodebug
fi

# create tgz archive
echo "Creating archive..."
echo "version: $1" > version.txt
cp app $APP
tar -czf $APP-$1.tar.gz $APP version.txt static/ bin/

# copy to server
echo "Uploading..."
scp $APP-$1.tar.gz $HOST:/var/www/$APP

# ssh into server and untar
echo "Extracting archive and restarting the server..."
ssh $HOST /bin/bash << EOF
    cd /var/www/$APP
    killall $APP
    tar -xzf $APP-$1.tar.gz
    rm $APP-$1.tar.gz
    nohup ./$APP >> $APP.log 2>&1 &
EOF

# cleanup + archive
rm $APP
rm version.txt

mv $APP-$1.tar.gz ../archive/
