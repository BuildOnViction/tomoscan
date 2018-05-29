FROM node:8-slim
WORKDIR /var/www/
# Expose env host
# This is needed to ensure communication between containers
# between docker containers
ENV HOST 0.0.0.0

RUN \
  apt-get update && \
  apt-get install -y python python-dev python-pip python-virtualenv && \
  apt-get install -y git nano && \
  rm -rf /var/lib/apt/lists/*

RUN npm i npm@latest -g
RUN npm install -g dotenv node-gyp pm2
COPY server/package.json /var/www/package.json
COPY server/package-lock.json /var/www/package-lock.json
RUN npm install

COPY server/.env.example /var/www/.env
COPY server /var/www
COPY server/pm2.json /var/www/pm2.json

RUN npm run build
CMD pm2-docker start pm2.json --only prod

EXPOSE 3333
