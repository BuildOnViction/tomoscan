FROM node:8-slim

WORKDIR /tomo-explorer
ENV NODE_ENV production

COPY package.json /tomo-explorer/package.json

RUN npm install --production

COPY .env.example /tomo-explorer/.env
COPY . /tomo-explorer

CMD ["npm", "start"]

EXPOSE 3000 27017
