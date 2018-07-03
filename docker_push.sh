#!/bin/bash

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin
docker tag tomochain/tomoscan-server tomochain/tomoscan-server:latest
docker tag tomochain/tomoscan-server tomochain/tomoscan-server:$TRAVIS_BUILD_ID
docker tag tomochain/tomoscan-client tomochain/tomoscan-client:latest
docker tag tomochain/tomoscan-client tomochain/tomoscan-client:$TRAVIS_BUILD_ID
docker push tomochain/tomoscan-server:latest
docker push tomochain/tomoscan-server:$TRAVIS_BUILD_ID
docker push tomochain/tomoscan-client:latest
docker push tomochain/tomoscan-client:$TRAVIS_BUILD_ID
