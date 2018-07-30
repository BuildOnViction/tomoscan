#!/bin/bash

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin
docker tag tomochain/tomoscan-server tomochain/tomoscan-server:$1
docker tag tomochain/tomoscan-client tomochain/tomoscan-client:$1
docker push tomochain/tomoscan-server:$1
docker push tomochain/tomoscan-client:$1
