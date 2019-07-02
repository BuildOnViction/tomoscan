<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card tomo-card--token">
            <div class="tomo-card__header">
                <h2 class="tomo-card__headline">{{ tokenName }}&nbsp;</h2>
                <i
                    v-if="moreInfo"
                    class="fa fa-check-circle token-status"
                    aria-hidden="true"/>
                <h6 class="mb-0">{{ symbol }}</h6>
            </div>
            <div class="tomo-card__body">
                <b-row>
                    <b-col md="6">
                        <table
                            v-if="token"
                            class="tomo-card__table">
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
                                    <td>{{ toTokenQuantity(holderBalance, token.decimals) }} {{ symbol }}</td>
                                </tr>
                                <tr>
                                    <td>Transfers</td>
                                    <td>{{ formatNumber(tokenTxsCount) }}</td>
                                </tr>
                                <tr>
                                    <td>Official Site</td>
                                    <td
                                        v-if="moreInfo">
                                        <a
                                            :href="moreInfo.website"
                                            target="_blank"
                                            class="text-truncate">{{ moreInfo.website }}</a>
                                    </td>
                                    <td
                                        v-else>
                                        Not Available,
                                        <nuxt-link
                                            :to="{name: 'tokens-slug-info', params: {slug: hash}}"
                                            class="text-truncate">Update</nuxt-link> ?
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </b-col>
                    <b-col md="6">
                        <table
                            v-if="token"
                            class="tomo-card__table">
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
                                    <td class="token-info-link">
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
                                            Not Available,
                                            <nuxt-link
                                                :to="{name: 'tokens-slug-info', params: {slug: hash}}"
                                                class="text-truncate">Update</nuxt-link> ?
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Filtered By</td>
                                    <td>
                                        <div class="input-group input-group-sm filter-address">
                                            <input
                                                v-model="addressFilter"
                                                type="text"
                                                class="form-control form-control-sm"
                                                placeholder="Address"
                                                aria-label="Address"
                                                @keyup.enter="filterAddress(addressFilter, token.type)">
                                            <div class="input-group-append">
                                                <button
                                                    class="btn btn-primary btn-primary-sm"
                                                    type="button"
                                                    @click="filterAddress(addressFilter, token.type)">
                                                    <i class="fa fa-filter"/>
                                                </button>
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
                    <!--:title="'Token Transfers (' + formatNumber(tokenTxsCount) + ')'"-->
                    <b-tab title="Token Transfers">
                        <table-token-tx-trc21
                            :token="hash"
                            :holder="holder"
                            :page="this"/>
                    </b-tab>
                    <b-tab
                        v-if="address && address.isContract && smartContract"
                        title="Code"
                        @click="refreshCodeMirror">
                        <read-source-code
                            ref="readSourceCode"
                            :token="hash"
                            :smartcontract="smartContract"
                            :address="address"/>
                    </b-tab>
                    <b-tab
                        v-if="smartContract"
                        title="Read Contract">
                        <read-contract
                            :contract="hash"/>
                    </b-tab>
                </b-tabs>
            </b-col>
        </b-row>
    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import ReadSourceCode from '~/components/ReadSourceCode'
import ReadContract from '~/components/ReadContract'
import TableTokenTxTrc21 from '~/components/TableTokenTxTrc21'

export default {
    components: {
        TableTokenTxTrc21,
        ReadContract,
        ReadSourceCode
    },
    mixins: [mixin],
    head () {
        return {
            title: 'Token TRC21 Holder Info'
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
            address: null,
            smartContract: null,
            holderBalance: 0
        }
    },
    created () {
        this.hash = this.$route.params.slug
        this.holder = this.$route.params.holder
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
        self.getAccountFromApi()
    },
    methods: {
        async getTokenHolder (token, holder) {
            let { data } = await this.$axios.get('/api/tokens/' + token + '/holder/' + holder)
            return data.quantity
        },
        async getAccountFromApi () {
            let self = this

            let { data } = await this.$axios.get('/api/accounts/' + self.hash)
            self.address = data
            self.smartContract = data.contract
        }
    }
}
</script>
