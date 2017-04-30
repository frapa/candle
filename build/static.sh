if [ ! -d $PWD/static ]
then
    rm -R static
    mkdir static
fi

wget localhost:5555/ -O static/index.html
wget localhost:5555/static/concat.js -O static/concat.js
wget localhost:5555/static/concat.css -O static/concat.css
wget localhost:5555/static/font/fontello.woff2 -O static/font/fontello.woff2

sed -i 's/\/static/\/android_asset\/static/g' static/index.html
sed -i 's/\/static/\/android_asset\/static/g' static/concat.css
sed -i 's/\/controller/http:\/\/127.0.0.1:5555\/controller/g' static/concat.js
sed -i 's/\/api/http:\/\/127.0.0.1:5555\/api/g' static/concat.js
