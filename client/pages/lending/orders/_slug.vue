<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card">
            <div class="tomo-card__header">
                <h3 class="tomo-card__headline">
                    Hash:
                    <read-more
                        :text="hash"
                        class="d-sm-none"/>
                    <read-more
                        :text="hash"
                        :max-chars="20"
                        class="d-none d-sm-inline-block d-lg-none"/>
                    <read-more
                        :text="hash"
                        :max-chars="30"
                        class="d-none d-lg-inline-block d-xl-none"/>
                    <span class="d-none d-xl-inline-block">{{ hash }}</span>
                </h3>
            </div>
            <div class="tomo-card__body">
                <table class="tomo-card__table">
                    <tbody>
                        <tr>
                            <td>Transaction Hash</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'txs-slug', params: {slug: lendingOrder.txHash}}">
                                    <read-more
                                        :text="lendingOrder.txHash"
                                        class="d-sm-none"/>
                                    <read-more
                                        :text="lendingOrder.txHash"
                                        :max-chars="20"
                                        class="d-none d-sm-block d-md-none"/>
                                    <read-more
                                        :text="lendingOrder.txHash"
                                        :max-chars="40"
                                        class="d-none d-md-block d-lg-none"/>
                                    <span class="d-none d-lg-block">{{ lendingOrder.txHash }}</span>

                                </nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>Lending Order Status</td>
                            <td>
                                <span
                                    v-if="lendingOrder.status === 'FILLED'"
                                    class="text-success">Filled</span>
                                <span
                                    v-else-if="lendingOrder.status === 'CANCELLED'"
                                    class="text-danger">Cancelled</span>
                                <span
                                    v-else-if="lendingOrder.status === 'OPEN'"
                                    class="text-info">Open</span>
                                <span
                                    v-else-if="lendingOrder.status === 'REJECTED'"
                                    class="text-danger">Rejected</span>
                                <span
                                    v-else
                                    class="text-purple">Partial Filled</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Dex address</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'address-slug',
                                          params: {slug:lendingOrder.relayer.toLowerCase()}}"
                                    class="mr-1">{{ lendingOrder.relayer.toLowerCase() }}</nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>User address</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'address-slug',
                                          params: {slug:lendingOrder.userAddress.toLowerCase()}}"
                                    class="mr-1">{{ lendingOrder.userAddress.toLowerCase() }}
                                </nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>Type</td>
                            <td>{{ lendingOrder.type === 'LO' ? 'Limit' : 'Market' }}</td>
                        </tr>
                        <tr>
                            <td>Side</td>
                            <td>{{ lendingOrder.side === 'INVEST' ? 'LEND' : lendingOrder.side }}</td>
                        </tr>
                        <tr>
                            <td>Lending token</td>
                            <td>
                                <nuxt-link
                                    v-if="lendingOrder.lendingToken !== tomoNativeToken"
                                    :to="{name: 'tokens-slug',
                                          params: {slug: lendingOrder.lendingToken.toLowerCase()}}">
                                    {{ lendingOrder.lendingToken.toLowerCase() }}</nuxt-link>
                                <span v-else>TOMO</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Collateral token</td>
                            <td>
                                <nuxt-link
                                    v-if="lendingOrder.collateralToken !== tomoNativeToken"
                                    :to="{name: 'tokens-slug',
                                          params: {slug: lendingOrder.collateralToken.toLowerCase()}}">
                                    {{ lendingOrder.collateralToken.toLowerCase() }}</nuxt-link>
                                <span v-else>TOMO</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Quantity</td>
                            <td>
                                {{ formatNumber(lendingOrder.quantity) }}
                                {{ lendingOrder.lendingSymbol !== tomoNativeToken ?
                                    lendingOrder.lendingSymbol : 'TOMO' }}
                            </td>
                        </tr>
                        <tr>
                            <td>Interest</td>
                            <td>{{ lendingOrder.interest }} %</td>
                        </tr>
                        <tr>
                            <td>Filled Amount</td>
                            <td>
                                {{ formatNumber(lendingOrder.filledAmount) }}
                                {{ lendingOrder.lendingSymbol !== tomoNativeToken ?
                                    lendingOrder.lendingSymbol : 'TOMO' }}
                            </td>
                        </tr>
                        <tr v-if="lendingOrder.status === 'CANCELLED'">
                            <td>Cancel fee</td>
                            <td>
                                {{ formatNumber(lendingOrder.cancelFee) }}
                                {{ lendingOrder.status === 'BORROW' ?
                                    lendingOrder.collateralSymbol : lendingOrder.lendingSymbol }}
                            </td>
                        </tr>
                        <tr>
                            <td>Auto</td>
                            <td>{{ lendingOrder.autoTopUp }}</td>
                        </tr>
                        <tr>
                            <td>Age</td>
                            <td>
                                <span
                                    v-b-tooltip.hover
                                    :title="$moment(lendingOrder.createdAt).format('lll')">
                                    {{ $moment(lendingOrder.createdAt).fromNow() }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <b-tabs
            ref="allTabs"
            class="tomo-tabs">
            <b-tab
                id="lendingTrades"
                title="Lending Trades"
                href="#lendingTrades">
                <table-lending-trade :order-hash="hash"/>
            </b-tab>
        </b-tabs>
    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import ReadMore from '~/components/ReadMore'
import TableLendingTrade from '~/components/TableLendingTrade'

export default {
    components: {
        ReadMore,
        TableLendingTrade
    },
    mixins: [mixin],
    data () {
        return {
            hash: null,
            lendingOrder: {},
            loading: true,
            tomoNativeToken: process.env.TOMO_NATIVE_TOKEN
        }
    },
    created () {
        this.hash = this.$route.params.slug
    },
    async mounted () {
        try {
            this.loading = true

            // Init breadcrumbs data.
            this.$store.commit('breadcrumb/setItems', {
                name: 'lending-orders-slug',
                to: { name: 'lending-orders-slug', params: { slug: this.hash } }
            })

            const { data } = await this.$axios.get('/api/lending/orders/' + this.hash)

            this.lendingOrder = data

            this.loading = false
        } catch (error) {
            console.log(error)
        }
    },
    head () {
        return {
            title: 'Lending Order ' + this.$route.params.slug + ' detail'
        }
    }
}
</script>
