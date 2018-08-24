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
                <b-tabs class="tomo-tabs">
                    <b-tab title="Overview">
                        <div class="card tomo-card tomo-card--transaction">
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
                                        <tr>
                                            <td>TxReceipt Status</td>
                                            <td>
                                                <span :class="tx.status ? 'text-success' : 'text-danger'">
                                                    {{ tx.status ? 'Success' : 'Fail' }}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Block</td>
                                            <td>
                                                <nuxt-link
                                                    v-if="tx.blockNumber"
                                                    :to="{name: 'blocks-slug', params: {slug:tx.blockNumber}}"
                                                    class="mr-1">{{ tx.blockNumber }}</nuxt-link>
                                                <span
                                                    v-else
                                                    class="text-muted mr-1">Pending...</span>
                                                <span>
                                                    ({{ (tx.latestBlockNumber - tx.blockNumber > 0)
                                                        ? tx.latestBlockNumber - tx.blockNumber
                                                    : 0 }} block confirmation)
                                                </span>
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
                                                <div v-if="tx.to">
                                                    <i
                                                        v-if="tx.to_model && tx.to_model.isContract"
                                                        class="tm tm-icon-contract mr-2"/>
                                                    <nuxt-link
                                                        :to="{name: 'address-slug', params: {slug: tx.to}}"
                                                        class="text-truncate">{{ tx.to_model.hash }}</nuxt-link>
                                                </div>
                                                <div v-else>
                                                    <span>[Contract&nbsp;</span>
                                                    <nuxt-link
                                                        :to="{name: 'address-slug', params: {slug: tx.to_model.hash}}">
                                                        {{ tx.to_model.hash }}</nuxt-link>
                                                    <span>&nbsp;Created]</span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Value</td>
                                            <td>{{ formatUnit(toEther(tx.value)) }}</td>
                                        </tr>
                                        <tr>
                                            <td>Gas Used By Txn</td>
                                            <td>{{ tx.gasUsed }}</td>
                                        </tr>
                                        <tr>
                                            <td>Gas Price</td>
                                            <td>{{ formatUnit(toEther(tx.gasPrice)) }}
                                                ({{ toGwei(tx.gasPrice) }} Gwei)</td>
                                        </tr>
                                        <tr>
                                            <td>Actual Tx Cost/Fee</td>
                                            <td>{{ formatUnit(toEther(tx.gasPrice * tx.gas)) }}</td>
                                        </tr>
                                        <tr v-if="tx.tokenTxs.length">
                                            <td>Token Transfer</td>
                                            <td>
                                                <ul class="list-unstyled">
                                                    <li
                                                        v-for="(tokenTx, index) in tx.tokenTxs"
                                                        :key="index"
                                                        class="mb-3">
                                                        <span>{{ toEther(tokenTx.value) }}</span>
                                                        <nuxt-link
                                                            :to="{
                                                                name: 'tokens-slug',
                                                                params: {slug: tokenTx.address}}">
                                                            <span
                                                                v-if="tokenTx.symbol"
                                                                v-html="'&nbsp;ERC20 (' + tokenTx.symbol + ')'"/>
                                                        </nuxt-link>
                                                        <span>&nbsp;from&nbsp;</span>
                                                        <nuxt-link
                                                            :to="{name: 'address-slug', params: {slug: tokenTx.from}}"
                                                            class="text-truncate">{{ tokenTx.from }}</nuxt-link>
                                                        <i class="fa fa-arrow-right ml-1 mr-2 text-success"/>
                                                        <nuxt-link
                                                            :to="{name: 'address-slug', params: {slug: tokenTx.to}}"
                                                            class="text-truncate">{{ tokenTx.to }}</nuxt-link>
                                                    </li>
                                                </ul>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Input Data</td>
                                            <td>
                                                <span class="text-danger">
                                                    <no-ssr placeholder="Codemirror Loading...">
                                                        <codemirror
                                                            :value="tx.input"
                                                            :options="{
                                                                mode:'application/ld+json',
                                                                gutters:[],
                                                                lineNumbers:false,styleActiveLine:false}" />
                                                    </no-ssr>
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </b-tab>
                    <b-tab
                        v-if="eventsCount > 0"
                        :title="'Events (' + eventsCount + ')'">
                        <table-event
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
            loading: true
        }
    },
    created () {
        this.hash = this.$route.params.slug
    },
    async mounted () {
        let self = this
        self.loading = true

        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', {
            name: 'txs-slug',
            to: { name: 'txs-slug', params: { slug: self.hash } }
        })

        let { data } = await this.$axios.get('/api/txs/' + self.hash)

        this.tx = data
        let moment = self.$moment(data.timestamp)
        this.tx.timestamp_moment = `${moment.fromNow()} <small>(${moment.format('lll')} +UTC)</small>`

        self.loading = false
    }
}
</script>
