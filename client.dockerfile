FROM node:8-slim
WORKDIR /var/www/
# Expose env host
# This is needed to ensure communication between containers
# between docker containers
ENV HOST 0.0.0.0

ADD client/package.json /var/www/package.json

RUN \
  apt-get update && \
  apt-get install -y python python-dev python-pip python-virtualenv && \
  apt-get install -y git nano && \
  rm -rf /var/lib/apt/lists/*
RUN npm install
RUN npm i npm@latest -g
RUN npm install -g nuxt dotenv node-gyp

ADD client/.env.example /var/www/.env
ADD client /var/www
#
#RUN cd /var/www && nuxt build
#
#CMD ["npm", "start"]
CMD ["sleep","3600"]

EXPOSE 3000