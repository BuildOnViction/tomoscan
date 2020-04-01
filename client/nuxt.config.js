require('dotenv').config()

module.exports = {
    /*
  ** Headers of the page
  */
    head: {
        title: 'TomoScan',
        meta: [
            { charset: 'utf-8' },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1'
            },
            {
                hid: 'description',
                name: 'description',
                content: 'Examining all blocks, transactions, finality, smart contracts and token information' +
                    ' with a user-friendly, details and perfection-oriented user interface.'
            },
            {
                property: 'og:url',
                content: 'https://scan.tomochain.com'
            },
            {
                property: 'og:type',
                content: 'website'
            },
            {
                property: 'og:title',
                content: 'TomoScan - TomoChain block explorer'
            },
            {
                property: 'og:description',
                content: 'Examining all blocks, transactions, finality, smart contracts and token information' +
                  ' with a user-friendly, details and perfection-oriented user interface.'
            },
            {
                property: 'og:image',
                content: 'https://scan.tomochain.com/newlogo.png'
            },
            {
                property: 'og:image:height',
                content: '256'
            },
            {
                property: 'og:image:width',
                content: '256'
            },
            {
                property: 'og:image:type',
                content: 'image/png'
            }
        ],
        link: [
            {
                rel: 'icon',
                type: 'image/x-icon',
                href: '/favicon.svg'
            }
        ],
        script: [
            { src: 'https://www.google.com/recaptcha/api.js' }
        ]
    },
    plugins: [
        '~/plugins/axios',
        '~/plugins/vuelidate',
        '~/plugins/bootstrap-vue',
        '~/plugins/clipboards',
        { src: '~/plugins/vue-codemirror', ssr: false }
    ],
    modules: [
        '@nuxtjs/axios',
        '@nuxtjs/moment',
        '@nuxtjs/font-awesome',
        '@nuxtjs/toast',
        '@nuxtjs/proxy',
        '@nuxtjs/recaptcha',
        [
            '@nuxtjs/google-analytics', {
                id: process.env.GA_ID || '',
                autoTracking: {
                    screenView: true
                }
            // }],
            }]
        // [
        //     'nuxt-imagemin', {
        //         optipng: { optimizationLevel: 5 },
        //         gifsicle: { optimizationLevel: 2 }
        //     }]
    ],
    recaptcha: {
        hideBadge: true, // Hide badge element (v3 & v2 via size=invisible)
        language: 'en', // Recaptcha language (v2)
        siteKey: process.env.RECAPTCHA_SITEKEY, // Site key for requests
        version: '1.0', // Version
        size: 'invisible' // Size: 'compact', 'normal', 'invisible' (v2)
    },
    css: [
        '~/assets/scss/app.scss'
    ],
    env: process.env,
    axios: {
        proxyHeaders: false,
        credentials: false,
        // baseURL: process.env.API_URL,
        proxy: true
    },
    proxy: {
        '/api/': process.env.API_URL,
        '/docs': process.env.API_URL
    },
    loading: {
        color: '#34a1ff',
        height: '2px'
    },
    build: {
        vendor: [
            '~/plugins/mixin'
        ],
        /*
    ** Run ESLINT on save
    */
        extend (config, ctx) {
            if (ctx.isClient) {
                config.module.rules.push({
                    enforce: 'pre',
                    test: /\.(js|vue)$/,
                    loader: 'eslint-loader',
                    exclude: /(node_modules)/
                })
            }
        }
    },
    watchers: {
        webpack: {
            poll: true
        }
    },
    toast: {
        position: 'bottom-center',
        duration: 2000
    },
    router: {
        extendRoutes (routes) {
            routes.push({ name: 'tx', path: '/tx', component: 'pages/txs/index.vue' })
            routes.push({ name: 'tx_slug', path: '/tx/:slug', component: 'pages/txs/_slug.vue' })
        }
    }
}
