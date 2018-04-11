module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'DLN Explorer', meta: [
      {charset: 'utf-8'}, {
        name: 'viewport', content: 'width=device-width, initial-scale=1',
      }, {
        hid: 'description', name: 'description', content: 'Nuxt.js project',
      },
    ], link: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons',
      },
      {
        rel: 'stylesheet',
        href: 'https://cdn.materialdesignicons.com/2.1.19/css/materialdesignicons.min.css',
      },
    ],
  },
  plugins: [
    '~/plugins/axios',
    '~/plugins/vuetify',
  ],
  modules: [
    '@nuxtjs/axios',
  ],
  vendor: [
    '~/plugins/vuetify',
  ],
  axios: {
    baseURL: process.env.API_URL,
  },
  css: ['~/assets/app.styl'],
  loading: {
    color: '#fff',
    height: '2px',
  },
  /*
  ** Add axios globally
  */
  build: {
    extractCSS: true,
    /*
    ** Run ESLINT on save
    */
    // extend (config, ctx) {
    //   if (ctx.isClient) {
    //     config.module.rules.push({
    //       enforce: 'pre',
    //       test: /\.(js|vue)$/,
    //       loader: 'eslint-loader',
    //       exclude: /(node_modules)/
    //     })
    //   }
    // }
  },
}
