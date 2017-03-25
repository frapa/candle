#!/bin/sh

# get the current path
ROOT_PATH=`pwd`

function join { shift; echo "$*"; }

PATHS=()
for ARG in $*
do
    PATHS+=("$ROOT_PATH/$ARG")
done

cd $ROOT_PATH/$1/build
while true
do
    FILE=`inotifywait -q -r -e modify --format "%f" "${PATHS[@]}"`
    echo $FILE

    case "$FILE" in
        *.go )
            compile.sh
            ;;
        *.js | *.css | *.html)
            compile.sh a b
            ;;
        *)
            continue
            ;;
    esac

    pkill -x app
    (./app &)
done
