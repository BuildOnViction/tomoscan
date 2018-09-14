import Cookie from 'js-cookie'
import store from 'store'

export const state = () => ({
    data: null
})

export const mutations = {
    setData (state, payload) {
        state.data = payload
        store.set('user', payload)
    },
    setToken (state, token) {
    // Save token into cookie.
        Cookie.set('token', token, { expires: 7 })
    }
}

export const actions = {
    async getCachedUser ({ commit }) {
        try {
            let user = store.get('user')
            if (user) {
                commit('setData', user)
            }

            return Promise.resolve()
        } catch (e) {
            return Promise.reject(e)
        }
    },
    async login ({ commit }, { email, password }) {
        let { data } = await this.$axios.post('/api/login', { email, password })

        commit('setData', data.user)
        commit('setToken', data.token)

        return data
    },
    async register ({ commit }, { email, password }) {
        let { data } = await this.$axios.post('/api/register', { email, password })

        commit('setData', data.user)
        commit('setToken', data.token)

        return data
    },
    async logout ({ commit }) {
        try {
            commit('setData', null)
            commit('setToken', null)

            return Promise.resolve()
        } catch (e) {
            return Promise.reject(e)
        }
    },
    async forgotPassword ({ commit }, { email, captchaToken }) {
        const { data } = await this.$axios.post('/api/lostpw', { email, captchaToken })

        commit('setData', null)
        commit('setToken', null)

        return data
    },
    async tokenValidation ({ commit }, { email, token }) {
        try {
            await this.$axios.post('/api/tokenValidation', { email, token })

            commit('setData', null)
            commit('setToken', null)
        } catch (error) {
            return Promise.reject(error)
        }
    },
    async resetpassword ({ commit }, { email, password, token }) {
        try {
            const data = await this.$axios.post('/api/reset-password', { email, password, token })

            commit('setData', null)
            commit('setToken', null)

            return data
        } catch (error) {
            return Promise.reject(error)
        }
    }
}
