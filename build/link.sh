APP=$(dirname $PWD)
CANDLE=${GOPATH}src/github.com/frapa/candle
BUILD=${APP}/build
APP_MODULE=${APP#*src/}/app

# clean up
#if [ -d ${BUILD}/static ]
#then
#    rm -R ${BUILD}/static
#fi


# First build go executable
go build ${APP_MODULE}

# Then copy the static folder
if [ ! -d ${BUILD}/static ]
then
    mkdir ${BUILD}/static
    mkdir ${BUILD}/static/models
    mkdir ${BUILD}/static/collections
fi

if [ ! -f ${APP}/modules.txt ] 
then
    echo "ERROR: Missing ${APP}/modules.txt"
    exit
fi

# List of folders to be copied
FOLDERS=(engine views libs js css templates models collections)

# Copy index.html
#cp ${CANDLE}/kernel/static/index.html ${BUILD}/static/

for FOLDER in ${FOLDERS[*]}
do
    if [ ! -d ${BUILD}/static/${FOLDER} ]
    then
        mkdir ${BUILD}/static/${FOLDER}
    fi

    # Copy folder from app
    if [ -d ${APP}/static/${FOLDER} ] && [ ! -d ${BUILD}/static/${FOLDER}/999_app ]
    then
        ln -s ${APP}/static/${FOLDER} ${BUILD}/static/${FOLDER}/999_app
        #cp -R ${APP}/static/${FOLDER} ${BUILD}/static/${FOLDER}/999_app
    fi

    # Copy modules
    i=0
    while read MODULE; do
        if [ -d ${CANDLE}/${MODULE}/static/${FOLDER} ] && [ ! -d ${BUILD}/static/${FOLDER}/${padded}_${MODULE} ]
        then
            padded=$(printf "%03d" $i)
            ln -s ${CANDLE}/${MODULE}/static/${FOLDER} ${BUILD}/static/${FOLDER}/${padded}_${MODULE}
            #cp -R ${CANDLE}/${MODULE}/static/${FOLDER} ${BUILD}/static/${FOLDER}/${padded}_${MODULE}
        fi
        i=$(( $i + 1 ))
    done < ${APP}/modules.txt
done
