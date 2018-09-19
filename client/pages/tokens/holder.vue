<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card tomo-card--token">
            <div class="tomo-card__header">
                <h2
                    class="tomo-card__headline"
                    v-html="tokenName"/>&nbsp;
                <h6 class="mb-0">{{ symbol }}</h6>
            </div>
            <div class="tomo-card__body">
                <b-row>
                    <b-col md="6">
                        <table
                            v-if="token"
                            class="tomo-card__table">
                            <thead>
                                <tr>
                                    <th>Summary</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Holder</td>
                                    <td>
                                        <nuxt-link
                                            :to="{name: 'address-slug', params:{slug: holder}}"
                                            class="text-truncate">{{ holder }}</nuxt-link>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Balance</td>
                                    <td>{{ toEther(convertHexToFloat(holderBalance.toString(), 16)) }} {{ symbol }}</td>
                                </tr>
                                <tr>
                                    <td>Transfers</td>
                                    <td>{{ formatNumber(tokenTxsCount) }}</td>
                                </tr>
                                <tr
                                    v-if="moreInfo">
                                    <td>Official Site</td>
                                    <td>
                                        <a
                                            :href="moreInfo.website"
                                            target="_blank"
                                            class="text-truncate">{{ moreInfo.website }}</a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </b-col>
                    <b-col md="6">
                        <table
                            v-if="token"
                            class="tomo-card__table">
                            <thead>
                                <tr>
                                    <td/>
                                    <th class="text-md-right">Reputation</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Contract</td>
                                    <td>
                                        <nuxt-link
                                            :to="{name: 'address-slug', params: {slug: token.hash}}"
                                            class="text-truncate">{{ token.hash }}</nuxt-link>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Decimal</td>
                                    <td>{{ token.decimals }}</td>
                                </tr>
                                <tr>
                                    <td>Links</td>
                                    <td>
                                        <ul
                                            v-if="moreInfo && moreInfo.communities"
                                            class="list-inline s-icons">
                                            <li
                                                v-for="(community, key) in moreInfo.communities"
                                                :key="key"
                                                class="list-inline-item">
                                                <a
                                                    :title="community.title"
                                                    :href="community.url">
                                                    <i :class="community.icon"/>
                                                </a>
                                            </li>
                                        </ul>
                                        <span v-else>
                                            Not Available, Update ?
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Filtered By</td>
                                    <td>
                                        <div class="input-group input-group-sm mb-2">
                                            <input
                                                v-model="addressFilter"
                                                type="text"
                                                class="form-control"
                                                placeholder="Address"
                                                aria-label="Address">
                                            <div class="input-group-append">
                                                <button
                                                    :onclick="filterAddress()"
                                                    class="btn btn-primary"
                                                    type="button">Apply</button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </b-col>
                </b-row>
            </div>
        </div>

        <b-row>
            <b-col>
                <b-tabs class="tomo-tabs">
                    <b-tab :title="'Token Transfers (' + tokenTxsCount + ')'">
                        <table-token-tx
                            :token="hash"
                            :holder="holder"
                            :page="this"/>
                    </b-tab>
                </b-tabs>
            </b-col>
        </b-row>
    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import TableTokenTx from '~/components/TableTokenTx'

export default {
    components: {
        TableTokenTx
    },
    mixins: [mixin],
    head () {
        return {
            title: 'Token ' + this.$route.params.slug + ' Info'
        }
    },
    data () {
        return {
            hash: null,
            token: null,
            tokenName: null,
            symbol: null,
            loading: true,
            tokenTxsCount: 0,
            holdersCount: 0,
            moreInfo: null,
            holder: null,
            addressFilter: null,
            holderBalance: 0
        }
    },
    created () {
        this.hash = this.$route.query.token
        this.holder = this.$route.query.holder
    },
    async mounted () {
        let self = this

        self.loading = true

        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', {
            name: 'tokens-slug',
            to: { name: 'tokens-slug', params: { slug: self.hash } }
        })

        let { data } = await self.$axios.get('/api/tokens/' + self.hash)
        self.token = data
        self.tokenName = data.name
        self.symbol = data.symbol

        self.loading = false
        self.moreInfo = data.moreInfo

        self.holderBalance = await self.getTokenHolder(self.hash, self.holder)
    },
    methods: {
        async getTokenHolder (token, holder) {
            let { data } = await this.$axios.get('/api/tokens/' + token + '/holder/' + holder)
            return data.quantity
        },
        async filterAddress () {
        }
    }
}
</script>
