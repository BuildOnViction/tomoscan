FROM node:8-alpine

LABEL maintainer="etienne@tomochain.com"

ENV HOST 0.0.0.0

WORKDIR /app

RUN apk --no-cache --virtual deps add \
      python \
      make \
      g++ \
      bash \
      git \
      libpng-dev \
      nasm \
      autoconf \
      automake \
    && npm install -g \
      npm@latest \
      nuxt \
      dotenv \
      node-gyp \
      pm2

COPY client/package*json ./

RUN npm install

COPY client .

RUN cp .env.example .env

RUN npm run build \
    && apk del deps

EXPOSE 3000

ENTRYPOINT ["npm"]
CMD ["start"]
