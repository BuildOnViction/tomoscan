require('dotenv').config()

module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'TOMO Explorer', meta: [
      {charset: 'utf-8'},
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        hid: 'description',
        name: 'description',
        content: 'TOMO Explorer project',
      },
    ], link: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico?v=001',
      },
    ],
  },
  plugins: [
    '~/plugins/axios',
    '~/plugins/vuelidate',
    '~/plugins/bootstrap-vue',
    '~/plugins/vue-highlightjs',
  ],
  modules: [
    '@nuxtjs/axios',
    '@nuxtjs/moment',
    '@nuxtjs/font-awesome',
    [
      'nuxt-imagemin', {
      optipng: {optimizationLevel: 5},
      gifsicle: {optimizationLevel: 2},
    }],
  ],
  css: [
    '~/assets/scss/app.scss',
  ],
  env: process.env,
  axios: {
    baseURL: process.env.API_URL,
  },
  loading: {
    color: '#34a1ff',
    height: '2px',
  },
  /*
  ** Add axios globally
  */
  build: {
//    extractCSS: true,
//    cssSourceMap: true,
    vendor: [
      '~/plugins/mixin',
    ],
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
