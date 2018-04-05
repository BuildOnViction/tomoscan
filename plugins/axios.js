export default function ({$axios, redirect}) {
  $axios.onRequest(config => {
    if(process.client) {
      window.$nuxt.$loading.start()
    }
  })

  $axios.onError(error => {
    const code = parseInt(error.response && error.response.status)
    console.log(code)
  })
}