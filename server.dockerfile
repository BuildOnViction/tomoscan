FROM node:8-slim
WORKDIR /var/www/
# Expose env host
# This is needed to ensure communication between containers
# between docker containers
ENV HOST 0.0.0.0

ADD server/package.json /var/www/package.json

RUN npm i npm@latest -g
RUN npm install
#RUN npm install -g nuxt dotenv node-gyp

ADD server/.env.example /var/www/.env
ADD server /var/www
#
RUN cd /var/www && npm run build
#
CMD ["npm", "start"]

EXPOSE 3333