#!/usr/bin/env bash

for i in `seq 557 800`
do
 NODE_ENV=mainnet node src/cmd.js epr $i
# NODE_ENV=mainnet node src/cmd.js epr 1
done



#!/usr/bin/env bash

DATADIR=/tomochain
if [ ! -d ${DATADIR}/tomo/chaindata ]
then
  tomo --datadir $DATADIR account import ${DATADIR}/pkey/pk1.txt --password ${DATADIR}/pkey/pass.txt
  tomo --datadir $DATADIR account import ${DATADIR}/pkey/pk2.txt --password ${DATADIR}/pkey/pass.txt
  tomo --datadir $DATADIR account import ${DATADIR}/pkey/pk3.txt --password ${DATADIR}/pkey/pass.txt
  tomo --datadir $DATADIR init ./genesis/mainnet.json
else
  tomo --datadir $DATADIR account import ${DATADIR}/pkey/pk1.txt --password ${DATADIR}/pkey/pass.txt
  tomo --datadir $DATADIR account import ${DATADIR}/pkey/pk2.txt --password ${DATADIR}/pkey/pass.txt
  tomo --datadir $DATADIR account import ${DATADIR}/pkey/pk3.txt --password ${DATADIR}/pkey/pass.txt
fi
VERBOSITY=2
GASPRICE="2500"
echo Starting the nodes ...
tomo \
    --bootnodes "enode://97f0ca95a653e3c44d5df2674e19e9324ea4bf4d47a46b1d8560f3ed4ea328f725acec3fcfcb37eb11706cf07da669e9688b091f1543f89b2425700a68bc8876@104.248.98.78:30301,enode://b72927f349f3a27b789d0ca615ffe3526f361665b496c80e7cc19dace78bd94785fdadc270054ab727dbb172d9e3113694600dd31b2558dd77ad85a869032dea@188.166.207.189:30301,enode://c8f2f0643527d4efffb8cb10ef9b6da4310c5ac9f2e988a7f85363e81d42f1793f64a9aa127dbaff56b1e8011f90fe9ff57fa02a36f73220da5ff81d8b8df351@104.248.98.60:30301" \
    --gcmode archive \
    --datadir "${DATADIR}" --networkid 88 --port 30303 \
    --syncmode full \
    --announce-txs \
    --rpc --rpccorsdomain "*" --rpcaddr 0.0.0.0 --rpcport 8545 --rpcvhosts "*" \
    --ws --wsaddr 0.0.0.0 --wsport 8546 --wsorigins "*" --unlock "0,1,2" \
    --ethstats "annonymous:getty-site-pablo-auger-room-sos-blair-shin-whiz-delhi@stats.tomochain.com:443" \
    --rpcapi db,eth,net,web3,personal \
    --password ${DATADIR}/pkey/unlockpass.txt --mine --gasprice "${GASPRICE}" --targetgaslimit "840000000"
