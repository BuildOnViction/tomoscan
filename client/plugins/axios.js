export default function ({$axios, redirect}) {
  $axios.onRequest(config => {
    if (process.client) {
      window.$nuxt.$loading.start()
    }
  })

  $axios.onError(error => {
    const code = parseInt(error.response && error.response.status)
    if (code && code != 422) {
      window.$nuxt.error({message: error.response.statusText, statusCode: code})
    }
  })
}