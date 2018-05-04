import Cookie from 'js-cookie'

export default function ({$axios, redirect, app, store}) {
  $axios.onRequest(config => {
    if (process.client) {
      window.$nuxt.$loading.start()

      let token = Cookie.get('token')
      if (token) {
        config.headers.common['Authorization'] = token
      }
    }
  })

  $axios.onError(error => {
    const code = parseInt(error.response && error.response.status)
    if (code && code != 422) {
      window.$nuxt.error({message: error.response.statusText, statusCode: code})
    }
  })
}