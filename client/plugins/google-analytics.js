import Vue from 'vue'
import VueAnalytics from 'vue-analytics'

Vue.use(VueAnalytics, {
    id: process.env.GA_ID,
    checkDuplicatedScript: true
})
