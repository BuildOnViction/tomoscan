//import web3Util from '../utils/web3'
//
//export const state = () => ({
//  web3: {
//    networkId: null,
//    coinbase: null,
//    balance: null,
//    error: null,
//  },
//})
//
//export const mutations = {
//  setWeb3 (state, payload) {
//    // console.log('registerWeb3Instance being executed', payload)
//
//    let result = payload
//    let _web3 = state.web3
//    _web3.coinbase = result.coinbase
//    _web3.networkId = result.networkId
//    _web3.balance = parseInt(result.balance, 10)
//    state.web3 = _web3
//  }
//}
//
//export const actions = {
//  async initWeb3 ({commit}) {
//    let result = {}
//    let web3 = web3Util.getWeb3()
//
//    web3.eth.net.getId((err, networkId) => {
//      if (err) {
//        return new Error('Unable to retrieve network ID')
//      } else {
//        result = Object.assign({}, result, {networkId})
//      }
//    })
//
//    await web3.eth.getCoinbase((err, coinbase) => {
//      if (err) {
//        return new Error('Unable to retrieve coinbase')
//      } else {
//        result = Object.assign({}, result, {coinbase})
//      }
//    })
//
//    await web3.eth.getBalance(result.coinbase, (err, balance) => {
//      if (err) {
//        return new Error('Unable to retrieve balance for _slug.vue: ' + result.coinbase)
//      } else {
//        result = Object.assign({}, result, {balance})
//      }
//    })
//
//    commit('setWeb3', result)
//  },
//
//  async getBlocks ({commit}) {
//    let web3 = await web3Util.getWeb3()
//    let blocks = []
//
//    let blockNumb = web3.eth.blockNumber
//    blocks.push(web3.eth.getBlock(blockNumb - 1))
//
//    return blocks
//  }
//}
