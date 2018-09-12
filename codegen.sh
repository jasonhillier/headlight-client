#!/bin/bash

echo "Updating code generator tool..."
docker pull swaggerapi/swagger-codegen-cli:latest

DIR=$(pwd)

echo "Generating html documentation..."
docker run -v $DIR:/headlight-client swaggerapi/swagger-codegen-cli generate -i /headlight-client/swagger.json -l html -o /headlight-client/docs
echo "Generating headlight-client (ts node library)..."
docker run -v $DIR:/headlight-client swaggerapi/swagger-codegen-cli generate -i /headlight-client/swagger.json -l typescript-node -DmodelPropertyNaming=original -DsupportsES6=true -o /headlight-client/node
echo "Generating headlight-client-angular (ts angular library)..."
docker run -v $DIR:/headlight-client swaggerapi/swagger-codegen-cli generate -i /headlight-client/swagger.json -l typescript-angular -DmodelPropertyNaming=original -DsupportsES6=true -DngVersion=6 -o /headlight-client/angular6
echo "Generating headlight-client-angular (ts angular library)..."
docker run -v $DIR:/headlight-client swaggerapi/swagger-codegen-cli generate -i /headlight-client/swagger.json -l typescript-angularjs -DmodelPropertyNaming=original -DsupportsES6=true -DngVersion=6 -o /headlight-client/angularjs



#config help tool
#docker run -v /Pavia/mpi_api/docs:/docs  swaggerapi/swagger-codegen-cli config-help -l typescript-node
