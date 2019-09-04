<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <h3 class="tomo-headline">
            <span class="mr-2">TXID:</span>
            <read-more
                :text="hash"
                class="d-sm-none" />
            <read-more
                :text="hash"
                :max-chars="20"
                class="d-none d-sm-inline-block d-md-none"/>
            <read-more
                :text="hash"
                :max-chars="30"
                class="d-none d-md-inline-block d-lg-none"/>
            <read-more
                :text="hash"
                :max-chars="40"
                class="d-none d-lg-inline-block d-2xl-none"/>
            <span class="d-none d-2xl-inline-block">{{ hash }}</span>
        </h3>

        <b-row>
            <b-col>
                <b-tabs
                    ref="allTabs"
                    v-model="tabIndex"
                    class="tomo-tabs"
                    @input="onSwitchTab">
                    <b-tab
                        title="Overview"
                        href="#overview">
                        <div
                            v-if="hashTab === '#overview'"
                            class="card tomo-card tomo-card--transaction">
                            <div class="tomo-card__body">
                                <table
                                    v-if="tx"
                                    class="tomo-card__table">
                                    <tbody>
                                        <tr>
                                            <td>TxHash</td>
                                            <td>
                                                <read-more
                                                    :text="tx.hash"
                                                    class="d-sm-none" />
                                                <read-more
                                                    :text="tx.hash"
                                                    :max-chars="20"
                                                    class="d-none d-sm-block d-md-none"/>
                                                <read-more
                                                    :text="tx.hash"
                                                    :max-chars="40"
                                                    class="d-none d-md-block d-lg-none"/>
                                                <span class="d-none d-lg-block">{{ tx.hash }}</span>
                                            </td>
                                        </tr>
                                        <tr v-if="tx.blockNumber">
                                            <td>TxReceipt Status</td>
                                            <td>
                                                <span :class="tx.status ? 'text-success' : 'text-danger'">
                                                    {{ tx.status ? 'Success' : 'Fail' }}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Block</td>
                                            <td>
                                                <span v-if="tx.blockNumber">
                                                    <nuxt-link
                                                        :to="{name: 'blocks-slug', params: {slug:tx.blockNumber}}"
                                                        class="mr-1">{{ tx.blockNumber }}</nuxt-link>
                                                    <span>
                                                        ({{ (tx.latestBlockNumber - tx.blockNumber > 0)
                                                            ? tx.latestBlockNumber - tx.blockNumber
                                                        : 0 }} block confirmation)
                                                    </span>
                                                </span>

                                                <span
                                                    v-else
                                                    class="text-muted mr-1">Pending...</span>

                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Time Stamp</td>
                                            <td v-html="tx.timestamp_moment"/>
                                        </tr>
                                        <tr>
                                            <td>From</td>
                                            <td>
                                                <i
                                                    v-if="tx.from_model && tx.from_model.isContract"
                                                    class="tm tm-icon-contract mr-2"/>
                                                <nuxt-link
                                                    :to="{name: 'address-slug', params: {slug: tx.from}}"
                                                    class="text-truncate">{{ tx.from }}</nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>To</td>
                                            <td>
                                                <div v-if="tx.contractAddress">
                                                    <span>[Contract&nbsp;</span>
                                                    <nuxt-link
                                                        :to="{name: 'address-slug',
                                                              params: {slug: tx.contractAddress}}">
                                                        {{ tx.contractAddress }}</nuxt-link>
                                                    <span>&nbsp;Created]</span>
                                                </div>
                                                <div v-else="">
                                                    <i
                                                        v-if="tx.to && tx.to_model && tx.to_model.isContract"
                                                        class="tm tm-icon-contract mr-2"/>
                                                    <nuxt-link
                                                        :to="{name: 'address-slug', params: {slug: tx.to}}"
                                                        class="text-truncate">{{ tx.to }}</nuxt-link>
                                                </div>
                                                <small
                                                    v-if="tx.internals && tx.internals.length > 0"
                                                    class="internal-tx">
                                                    <p
                                                        v-for="(internal, key) in tx.internals"
                                                        :key="key">
                                                        <span class="text-secondary">TRANSFER </span>
                                                        <span class="internal-color">
                                                            {{ formatUnit(toTomo(internal.value, 18)) }}</span>
                                                        <span class="text-secondary"> From </span>
                                                        <nuxt-link
                                                            :to="{name: 'address-slug', params: {slug: internal.from}}"
                                                            class="hash-tag text-truncate">
                                                            {{ internal.from }}</nuxt-link>
                                                        <span class="text-secondary"> To </span>
                                                        <nuxt-link
                                                            :to="{name: 'address-slug', params: {slug: internal.to}}"
                                                            class="hash-tag text-truncate">{{ internal.to }}</nuxt-link>
                                                    </p>
                                                </small>
                                            </td>
                                        </tr>
                                        <tr v-if="tx.trc21FeeFund >= 0">
                                            <td>TRC21 Fee Fund</td>
                                            <td>{{ formatUnit(toTomo(tx.trc21FeeFund, 18)) }}</td>
                                        </tr>
                                        <tr>
                                            <td>Value</td>
                                            <td>{{ formatUnit(toTomo(tx.value, 18)) }}</td>
                                        </tr>
                                        <tr>
                                            <td>Gas Used By Txn</td>
                                            <td>{{ formatNumber(tx.gasUsed) }}</td>
                                        </tr>
                                        <tr>
                                            <td>Gas Price</td>
                                            <td>{{ formatUnit(toTomo(tx.gasPrice, 18)) }}</td>
                                        </tr>
                                        <tr>
                                            <td>Actual Tx Cost/Fee</td>
                                            <td>{{ formatUnit(toTomo(tx.gasPrice * tx.gasUsed, 18)) }}</td>
                                        </tr>
                                        <tr v-if="tx.trc20Txs && tx.trc20Txs.length">
                                            <td>TRC20 Transfer</td>
                                            <td>
                                                <span class="token-transfer">
                                                    <p
                                                        v-for="(tokenTx, index) in tx.trc20Txs"
                                                        :key="index"
                                                        class="mb-3">
                                                        <span class="text-secondary">From </span>
                                                        <nuxt-link
                                                            :to="{
                                                                name: 'tokens-slug-trc20-holder',
                                                                params: {slug: tokenTx.address, holder: tokenTx.from}
                                                            }"
                                                            class="hash-tag text-truncate">
                                                            {{ tokenTx.from }}</nuxt-link>
                                                        <span class="text-secondary"> To </span>
                                                        <nuxt-link
                                                            :to="{
                                                                name: 'tokens-slug-trc20-holder',
                                                                params: {slug: tokenTx.address, holder: tokenTx.to}
                                                            }"
                                                            class="hash-tag text-truncate">
                                                            {{ tokenTx.to }}</nuxt-link>
                                                        <span class="text-secondary"> For </span>
                                                        <span class="internal-color">{{
                                                        toTokenQuantity(tokenTx.value, tokenTx.decimals) }}</span>
                                                        <nuxt-link
                                                            :to="{
                                                                name: 'tokens-slug',
                                                                params: {slug: tokenTx.address}}">
                                                            &nbsp;
                                                            <span
                                                                v-if="tokenTx.symbol">TRC20 {{ tokenTx.symbol }}</span>
                                                        </nuxt-link>
                                                    </p>
                                                </span>
                                            </td>
                                        </tr>
                                        <tr v-if="tokenFee.tokenOwner">
                                            <td>TRC21 Token Fee</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{
                                                        name: 'tokens-slug',
                                                        params: {slug: tokenFee.token}}">
                                                    <span class="internal-color">{{
                                                        toTokenQuantity(tokenFee.value,
                                                                        tokenFee.decimals) }} </span>
                                                    {{ tokenFee.symbol }}
                                                </nuxt-link>
                                                <span class="text-secondary"> For Token Issuer </span>
                                                <nuxt-link
                                                    :to="{
                                                        name: 'tokens-slug-trc21-holder',
                                                        params: {slug: tokenFee.token, holder: tokenFee.tokenOwner}
                                                    }"
                                                    class="hash-tag text-truncate">
                                                    {{ tokenFee.tokenOwner }}</nuxt-link>
                                            </td>
                                        </tr>
                                        <tr v-if="tx.trc21Txs && tx.trc21Txs.length">
                                            <td>TRC21 Transfer</td>
                                            <td>
                                                <span class="token-transfer">
                                                    <span
                                                        v-for="(tokenTx, index) in tx.trc21Txs"
                                                        :key="index"
                                                        class="mb-3">
                                                        <p>
                                                            <span class="text-secondary">From </span>
                                                            <nuxt-link
                                                                :to="{
                                                                    name: 'tokens-slug-trc21-holder',
                                                                    params: { slug: tokenTx.address,
                                                                              holder: tokenTx.from }
                                                                }"
                                                                class="hash-tag text-truncate">
                                                                {{ tokenTx.from }}</nuxt-link>
                                                            <span class="text-secondary"> To </span>
                                                            <nuxt-link
                                                                :to="{
                                                                    name: 'tokens-slug-trc21-holder',
                                                                    params: {slug: tokenTx.address,
                                                                             holder: tokenTx.to}
                                                                }"
                                                                class="hash-tag text-truncate">
                                                                {{ tokenTx.to }}</nuxt-link>
                                                            <span class="text-secondary"> For </span>
                                                            <span class="internal-color">{{
                                                                toTokenQuantity(tokenTx.value,
                                                                                tokenTx.decimals) }} </span>
                                                            <nuxt-link
                                                                :to="{
                                                                    name: 'tokens-slug',
                                                                    params: {slug: tokenTx.address}}">
                                                                <span
                                                                    v-if="tokenTx.symbol">TRC21 {{ tokenTx.symbol }}
                                                                </span>
                                                            </nuxt-link>
                                                        </p>
                                                    </span>
                                                </span>
                                            </td>
                                        </tr>
                                        <tr v-if="tx.trc721Txs && tx.trc721Txs.length">
                                            <td>TRC721 Transfer</td>
                                            <td>
                                                <span class="token-transfer">
                                                    <p
                                                        v-for="(tokenTx, index) in tx.trc721Txs"
                                                        :key="index"
                                                        class="mb-3">
                                                        <span class="text-secondary">From </span>
                                                        <nuxt-link
                                                            :to="{
                                                                name: 'tokens-slug-trc721-holder',
                                                                params: {slug: tokenTx.address, holder: tokenTx.from}
                                                            }"
                                                            class="hash-tag text-truncate">
                                                            {{ tokenTx.from }}</nuxt-link>
                                                        <span class="text-secondary"> To </span>
                                                        <nuxt-link
                                                            :to="{
                                                                name: 'tokens-slug-trc721-holder',
                                                                params: {slug: tokenTx.address, holder: tokenTx.to}
                                                            }"
                                                            class="hash-tag text-truncate">
                                                            {{ tokenTx.to }}</nuxt-link>
                                                        <span class="text-secondary"> For TRC721 TokenID</span>
                                                        [{{ tokenTx.tokenId }}]
                                                        <nuxt-link
                                                            :to="{
                                                                name: 'tokens-slug',
                                                                params: {slug: tokenTx.address}}">
                                                            {{ tokenTx.symbol }}
                                                        </nuxt-link>
                                                    </p>
                                                </span>
                                            </td>
                                        </tr>
                                        <tr
                                            v-for="(info, index) in tx.extraInfo"
                                            :key="index">
                                            <td>{{ info.infoName }}</td>
                                            <td>{{ info.infoValue }}</td>
                                        </tr>
                                        <tr>
                                            <td>Input Data</td>
                                            <td>
                                                <span class="text-danger">
                                                    <no-ssr placeholder="Codemirror Loading...">
                                                        <codemirror
                                                            ref="readSourceCode"
                                                            v-model="inputData"
                                                            :options="{
                                                                mode:'application/ld+json',
                                                                gutters:[],
                                                                lineNumbers:false,styleActiveLine:false}"
                                                            @ready="refreshInputTxCodeMirror"/>
                                                    </no-ssr>
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </b-tab>
                    <!--:title="'Events (' + formatNumber(eventsCount) + ')'"-->
                    <b-tab
                        v-if="eventsCount > 0"
                        title="Events"
                        href="#events">
                        <table-event
                            v-if="hashTab === '#events'"
                            :tx="hash"
                            :page="this"/>
                    </b-tab>
                </b-tabs>
            </b-col>
        </b-row>
    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import TableEvent from '~/components/TableEvent'
import ReadMore from '~/components/ReadMore'

export default {
    components: {
        TableEvent,
        ReadMore
    },
    mixins: [mixin],
    head () {
        return {
            title: 'Transaction ' + this.$route.params.slug + ' Info'
        }
    },
    data () {
        return {
            hash: null,
            tx: null,
            eventsCount: 0,
            loading: true,
            tabIndex: 0,
            tokenFee: {}
        }
    },
    computed: {
        hashTab () {
            return this.$route.hash || '#overview'
        }
    },
    created () {
        this.hash = this.$route.params.slug
    },
    async mounted () {
        try {
            let self = this
            self.loading = true

            // Init breadcrumbs data.
            this.$store.commit('breadcrumb/setItems', {
                name: 'txs-slug',
                to: { name: 'txs-slug', params: { slug: self.hash } }
            })

            let params = {}

            if (self.hash) {
                params.address = self.hash
            }
            params.list = 'txs'

            let query = this.serializeQuery(params)

            let responses = await Promise.all([
                this.$axios.get('/api/txs/' + self.hash),
                this.$axios.get('/api/counting' + '?' + query)
            ])

            self.tx = responses[0].data
            self.inputData = self.tx.inputData ? self.tx.inputData : self.tx.input
            let moment = self.$moment(responses[0].data.timestamp)
            self.tx.timestamp_moment = `${moment.fromNow()} <small>(${moment.format('lll')} +UTC)</small>`

            self.eventsCount = responses[1].data.events

            if (self.tx.trc21Txs && self.tx.trc21Txs.length > 1 && self.tx.to_model) {
                self.tokenFee.tokenOwner = self.tx.to_model.contractCreation
                for (let i = 0; i < self.tx.trc21Txs.length; i++) {
                    if (self.tokenFee.tokenOwner === self.tx.trc21Txs[i].to) {
                        self.tokenFee.value = self.tx.trc21Txs[i].value
                        self.tokenFee.decimals = self.tx.trc21Txs[i].decimals
                        self.tokenFee.symbol = self.tx.trc21Txs[i].symbol
                        self.tokenFee.token = self.tx.trc21Txs[i].address
                    }
                }
            }

            self.loading = false
        } catch (error) {
            console.log(error)
        }
    },
    methods: {
        updateHashChange () {
            const allTabs = this.$refs.allTabs
            if (this.$route.hash) {
                allTabs.tabs.forEach((i, index) => {
                    if (i.href === this.$route.hash) {
                        this.tabIndex = index
                        return
                    }
                    return true
                })
            }
        },
        onSwitchTab () {
            const allTabs = this.$refs.allTabs
            if (allTabs) {
                const value = this.tabIndex
                const location = window.location
                location.hash = allTabs.tabs[value].href
            }
        }
    }
}
</script>
