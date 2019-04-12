<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card tomo-card--token">
            <div class="tomo-card__header">
                <h2 class="tomo-card__headline">{{ tokenName }}&nbsp;</h2>
                <h6 class="mb-0">{{ symbol }}</h6>
            </div>
            <div class="tomo-card__body">
                <ul
                    v-if="errors.length"
                    class="alert alert-danger">
                    <li
                        v-for="(error, index) in errors"
                        :key="index">{{ error }}</li>
                </ul>
                <b-row>
                    <sign-message-step
                        :address="hash"
                        :page="this"/>
                    <table
                        v-if="authen"
                        class="tomo-card__table">
                        <tbody>
                            <tr>
                                <td>Contract</td>
                                <td>
                                    <nuxt-link
                                        :to="{name: 'address-slug', params: {slug: token.hash}}">
                                        {{ token.hash }}</nuxt-link>
                                </td>
                            </tr>
                            <tr v-if="address">
                                <td>Creation</td>
                                <td>
                                    <nuxt-link
                                        :to="{name: 'address-slug', params: {slug: address.contractCreation}}">
                                        {{ address.contractCreation }}</nuxt-link>
                                </td>
                            </tr>
                            <tr>
                                <td>Official Site</td>
                                <td>
                                    <input
                                        v-model="website"
                                        type="text"
                                        class="form-control"
                                        placeholder="Website"
                                        aria-label="Website">
                                </td>
                            </tr>
                            <tr>
                                <td>Overview</td>
                                <td>
                                    <input
                                        v-model="overview"
                                        type="text"
                                        class="form-control"
                                        placeholder="Overview"
                                        aria-label="Overview">
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="pull-left">Links</div>
                                    <div class="pull-right">
                                        <button
                                            type="button"
                                            class="btn btn-primary mb-2"
                                            @click="addSocial">Add more</button>
                                    </div>

                                </td>
                                <td>
                                    <ul class="list-inline s-icons">
                                        <li
                                            v-for="(s, index) in socialValue"
                                            :key="index"
                                            class="list-inline-item">
                                            <div class="form-row align-items-center">
                                                <div class="col-auto">
                                                    <select
                                                        v-model="s.type"
                                                        class="form-control mb-2">
                                                        <option
                                                            value=""
                                                            disabled
                                                            hidden>Link type ...</option>
                                                        <option
                                                            v-for="(sType, tIndex) in social"
                                                            :key="tIndex"
                                                            :value="tIndex">{{ sType }}</option>
                                                    </select>
                                                </div>

                                                <div class="col-auto">
                                                    <input
                                                        v-model="s.value"
                                                        type="text"
                                                        class="form-control mb-2"
                                                        placeholder="Link value">
                                                </div>
                                                <div class="col-auto">
                                                    <button
                                                        type="button"
                                                        class="btn btn-danger mb-2"
                                                        @click="deleteSocial(index)">Remove</button>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td>ICO information</td>
                                <td>

                                    <textarea
                                        v-model="icoInfo"
                                        cols="30"
                                        rows="10"
                                        class="form-control"/>
                                </td>
                            </tr>
                            <tr>
                                <td/>
                                <td>
                                    <button
                                        type="button"
                                        class="btn btn-primary mb-2"
                                        @click="updateInfo">Update</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </b-row>
            </div>
        </div>

    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import SignMessageStep from '~/components/SignMessage'

export default {
    components: {
        SignMessageStep
    },
    mixins: [mixin],
    head () {
        return {
            title: 'Token ' + this.$route.params.slug + ' Info'
        }
    },
    data: () => ({
        hash: null,
        token: null,
        tokenName: null,
        symbol: null,
        loading: true,
        address: null,
        errors: [],
        socialValue: [{
            type: '',
            value: ''
        }],
        socialIcon: {
            facebook: 'fa fa-facebook',
            email: 'fa fa-envelope',
            medium: 'fa fa-pencil-square-o',
            twitter: 'fa fa-twitter',
            bitcointalk: 'fa fa-btc',
            github: 'fa fa-github',
            telegram: 'fa fa-telegram',
            whitepaper: 'fa fa-file-text-o',
            coinmarketcap: 'fa fa-bar-chart'
        },
        social: {
            facebook: 'Facebook',
            email: 'Email',
            medium: 'Medium',
            twitter: 'Twitter',
            bitcointalk: 'BitcoinTalk',
            github: 'Github',
            telegram: 'Telegram',
            whitepaper: 'WhitePager',
            coinmarketcap: 'CoinMarketCap'
        },
        website: '',
        overview: '',
        icoInfo: '',
        signMessage: '',
        authen: false,
        signHash: '',
        sigMessage: ''
    }),
    created () {
        this.hash = this.$route.params.slug
    },
    async mounted () {
        let self = this

        self.loading = true

        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', {
            name: 'tokens-slug-info',
            to: { name: 'tokens-slug-info', params: { slug: self.hash } }
        })

        let { data } = await self.$axios.get('/api/tokens/' + self.hash)
        self.token = data
        self.tokenName = data.name
        self.symbol = data.symbol

        self.loading = false
        self.getAccountFromApi()
    },
    methods: {
        async getAccountFromApi () {
            let self = this

            let { data } = await this.$axios.get('/api/accounts/' + self.hash)
            self.address = data
        },
        addSocial () {
            this.socialValue.push({ type: '', value: '' })
        },
        deleteSocial (index) {
            this.socialValue.splice(index, 1)
            if (index === 0) {
                this.addSocial()
            }
        },
        async updateInfo () {
            let communities = []
            for (let s of this.socialValue) {
                if (s.type) {
                    communities.push({
                        name: s.type,
                        url: s.value,
                        title: this.social[s.type],
                        icon: this.socialIcon[s.type]
                    })
                }
            }
            let body = {
                signData: {
                    sigMessage: this.signMessage,
                    sigHash: this.signHash
                },
                data: {
                    hash: this.hash,
                    website: this.website,
                    communities: communities,
                    overview: this.overview,
                    icoInfo: this.icoInfo
                }
            }
            let { data } = await this.$axios.post('/api/tokens/' + this.hash + '/updateInfo', body)
            if (data.errors) {
                this.errors = data.errors
            } else {
                return this.$router.push({ name: 'tokens-slug', params: { slug: this.hash } })
            }
        }
    }
}
</script>
