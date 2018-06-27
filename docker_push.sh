#!/bin/bash

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin
docker tag tomochain/tomochain-explorer-server tomochain/tomochain-explorer-server:latest
docker tag tomochain/tomochain-explorer-server tomochain/tomochain-explorer-server:$TRAVIS_BUILD_ID
docker tag tomochain/tomochain-explorer-client tomochain/tomochain-explorer-client:latest
docker tag tomochain/tomochain-explorer-client tomochain/tomochain-explorer-client:$TRAVIS_BUILD_ID
docker push tomochain/tomochain-explorer-server:latest
docker push tomochain/tomochain-explorer-server:$TRAVIS_BUILD_ID
docker push tomochain/tomochain-explorer-client:latest
docker push tomochain/tomochain-explorer-client:$TRAVIS_BUILD_ID
