FROM node:8-slim
WORKDIR /var/www/
# Expose env host
# This is needed to ensure communication between containers
# between docker containers
ENV HOST 0.0.0.0

COPY client/package.json /var/www/package.json

RUN \
  apt-get update && \
  apt-get install -y python python-dev python-pip python-virtualenv && \
  apt-get install -y git nano && \
  rm -rf /var/lib/apt/lists/*

RUN npm install
RUN npm i npm@latest -g
RUN npm install -g nuxt dotenv node-gyp pm2

COPY client/.env.example /var/www/.env
COPY client /var/www
COPY client/pm2.json /var/www/pm2.json

CMD sleep 300

EXPOSE 3000