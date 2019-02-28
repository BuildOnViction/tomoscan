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
    && npm install -g \
       npm@latest \
       dotenv \
       node-gyp

COPY server/package*json ./
RUN npm install

COPY server .

RUN apk del deps

EXPOSE 3333

ENTRYPOINT ["./entrypoint.sh"]

CMD ["start"]
