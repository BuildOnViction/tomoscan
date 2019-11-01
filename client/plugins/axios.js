import Cookie from 'js-cookie'

export default function ({ $axios, redirect, app, store }) {
    $axios.onRequest(config => {
        if (process.client) {
            window.$nuxt.$loading.start()

            let token = Cookie.get('token')
            if (token) {
                config.headers.common['Authorization'] = token
            }
            config.headers.common['Access-Control-Allow-Origin'] = '*'
        }
    })

    $axios.onError(error => {
        const code = parseInt(error.response && error.response.status)
        if (code) {
            switch (code) {
            case 401:
                store.dispatch('user/logout')
                // Redirect to home.
                return window.$nuxt.$router.replace({ name: 'index' })
            case 404:
                window.$nuxt.error(
                    { message: error.response.statusText, statusCode: code })
                break
            default:
                // window.$nuxt.error(
                //     { message: error.response.statusText, statusCode: code })
                break
            }
        }
    })
}
