# TomoChain Explorer - Tomoscan

Tomoscan is a BlockExplorer for **TomoChain**, built with VueJS, Nuxt and MongoDB. Tomoscan allows you to explore and search the **TomoChain** for transactions, addresses, tokens, prices and other activities taking place on **TomoChain**.

A demo instance connected to the **TomoChain testnet** is available at [explorer-testnet.tomochain.com](https://explorer-testnet.tomochain.com/).

## Current Features
- Browse blocks, transactions, accounts and contracts
- View pending transactions
- Upload & verify contract sources
- Display the current state of verified contracts
- Follow an address list
- Responsive layout

Missing a feature? Please request it by creating a new [Issue](https://github.com/tomochain/tomo-explorer/issues).

## Usage notes

The explorer is still under heavy development, if you find any problems please create [an issue](https://github.com/tomochain/tomo-explorer/issues) or prepare [a pull request](https://github.com/tomochain/tomo-explorer/pulls).

## Getting started

### Requirements
- [Docker](https://www.docker.com/get-docker)

### Setup

Copy .env files
```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Build & up docker
```bash
docker-compose -f docker-compose-dev.yml up --build
```
The site will run at http://localhost:3000, server will run at http://localhost:3333

### Environment variables

#### Client (in `client/.env`)

```bash
API_URL=http://localhost:3333
WS_URL=http://localhost:3333
BASE_UNIT=TOMO
```
#### Server (in `server/.env`)
```bash
MONGODB='localhost'
MONGODB_URI=mongodb://localhost:27017/explorer

WEB3_URI=https://testnet.tomochain.com/
WEB3_WS_URI=wss://testnet.tomochain.com/ws
BASE_UNIT=TOMO
PORT=3333
DEBUG=express:*

CLIENT_URL=http://localhost:3000/
CMC_ID=2570
SLACK_WEBHOOK_URL=
```