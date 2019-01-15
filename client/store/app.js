export const state = () => ({
    usdPrice: 0
})

export const mutations = {
    setUSDPrice (state, usdPrice) {
        state.usdPrice = usdPrice
    }
}

export const actions = {
    async getUSDPrice ({ commit }) {
        try {
            let { data } = await this.$axios.get('/api/setting/usd')

            commit('setUSDPrice', data.tomochain.usd)

            return Promise.resolve()
        } catch (e) {
            return Promise.reject(e)
        }
    }
}
