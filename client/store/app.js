export const state = () => ({
  usdPrice: null,
})

export const mutations = {
  setUSDPrice (state, usdPrice) {
    state.usdPrice = usdPrice
  },
}

export const actions = {
  async getUSDPrice ({commit}) {
    try {
      let {data} = await this.$axios.get('https://api.coinmarketcap.com/v2/ticker/' +
        process.env.CMC_ID + '/?convert=USD')

      commit('setUSDPrice', data.data.quotes.USD.price)

      return Promise.resolve()
    }
    catch (e) {
      return Promise.reject(e)
    }
  },
}