# TomoChain Explorer - Tomoscan

[![Join the chat at https://gitter.im/tomochain/tomoscan](https://badges.gitter.im/tomochain/tomoscan.svg)](https://gitter.im/tomochain/tomoscan?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Tomoscan is a BlockExplorer for **TomoChain**, built with VueJS, Nuxt and MongoDB. Tomoscan allows you to explore and search the **TomoChain** for transactions, addresses, tokens, prices and other activities taking place on **TomoChain**.

A demo instance connected to the **TomoChain testnet** is available at [scan.testnet.tomochain.com](https://scan.testnet.tomochain.com/).

## Current Features
- Browse blocks, transactions, accounts and contracts
- View pending transactions
- Upload & verify contract sources
- Display the current state of verified contracts
- Responsive layout

Missing a feature? Please request it by creating a new [Issue](https://github.com/tomochain/tomoscan/issues).

## Usage notes

The explorer is still under heavy development, if you find any problems please create [an issue](https://github.com/tomochain/tomoscan/issues) or prepare [a pull request](https://github.com/tomochain/tomoscan/pulls).

## Getting started

### Requirements
- [NodeJS](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)

### Setup

Copy and modify your config
```bash
cp client/.env.example client/.env
cp server/config/default.json server/config/local.json
```

Install library
```bash
cd client/ && npm install
```

```bash
cd server/ && npm install
```

### Run
After modify your config & install library. Your environment is ready to start

- Run client to view in browser
```bash
cd client/ && npm run dev
```

- Run API server for client
```bash
cd server/ && npm run server-dev
```

- Run crawl data for API server
```bash
cd server/ && npm run crawl-dev
```

- Get transaction pending
```bash
cd server/ && npm run subscribe-pending-tx-dev
```
