<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <h3 class="tomo-headline">
            <span class="mr-2">Lending Trade Hash:</span>
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
                    class="tomo-tabs">
                    <b-tab
                        title="Overview"
                        href="#overview">
                        <div
                            class="card tomo-card tomo-card--transaction">
                            <div class="tomo-card__body">
                                <table class="tomo-card__table">
                                    <tbody>
                                        <tr>
                                            <td>Transaction Hash</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{name: 'txs-slug', params: {slug: lendingTrade.txHash}}">
                                                    <read-more
                                                        :text="lendingTrade.txHash"
                                                        class="d-sm-none" />
                                                    <read-more
                                                        :text="lendingTrade.txHash"
                                                        :max-chars="20"
                                                        class="d-none d-sm-block d-md-none"/>
                                                    <read-more
                                                        :text="lendingTrade.txHash"
                                                        :max-chars="40"
                                                        class="d-none d-md-block d-lg-none"/>
                                                    <span class="d-none d-lg-block">{{ lendingTrade.txHash }}</span>

                                                </nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Lending Trade Status</td>
                                            <td>
                                                <span
                                                    v-if="lendingTrade.status === 'FILLED'"
                                                    class="text-success">Filled</span>
                                                <span
                                                    v-else-if="lendingTrade.status === 'CANCELLED'"
                                                    class="text-danger">Cancelled</span>
                                                <span
                                                    v-else-if="lendingTrade.status === 'OPEN'"
                                                    class="text-info">Open</span>
                                                <span
                                                    v-else-if="lendingTrade.status === 'REJECTED'"
                                                    class="text-danger">Rejected</span>
                                                <span
                                                    v-else
                                                    class="text-purple">Partial Filled</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Borrowing Relayer</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{name: 'address-slug',
                                                          params: {slug:lendingTrade.borrowingRelayer.toLowerCase()}}"
                                                    class="mr-1">{{ lendingTrade.borrowingRelayer.toLowerCase() }}
                                                </nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Investing Relayer</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{name: 'address-slug',
                                                          params: {slug:lendingTrade.investingRelayer.toLowerCase()}}"
                                                    class="mr-1">{{ lendingTrade.investingRelayer.toLowerCase() }}
                                                </nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Borrower</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{name: 'address-slug',
                                                          params: {slug:lendingTrade.borrower.toLowerCase()}}"
                                                    class="mr-1">{{ lendingTrade.borrower.toLowerCase() }}
                                                </nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Investor</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{name: 'address-slug',
                                                          params: {slug:lendingTrade.investor.toLowerCase()}}"
                                                    class="mr-1">{{ lendingTrade.investor.toLowerCase() }}
                                                </nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Lending token</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{name: 'tokens-slug',
                                                          params: {slug: lendingTrade.lendingToken.toLowerCase()}}">
                                                    {{ lendingTrade.lendingToken.toLowerCase() }}</nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Collateral token</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{name: 'tokens-slug',
                                                          params: {slug: lendingTrade.collateralToken.toLowerCase()}}">
                                                    {{ lendingTrade.collateralToken.toLowerCase() }}</nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Amount</td>
                                            <td>
                                                {{ formatNumber(lendingTrade.amount) }}
                                                {{ lendingTrade.lendingSymbol }}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Borrowing Fee</td>
                                            <td>
                                                {{ formatNumber(lendingTrade.borrowingFee) }}
                                                {{ lendingTrade.lendingSymbol }}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Interest</td>
                                            <td>{{ lendingTrade.interest }} %</td>
                                        </tr>
                                        <tr>
                                            <td>Collateral Lock Amount</td>
                                            <td>
                                                {{ formatNumber(lendingTrade.collateralLockedAmount) }}
                                                {{ lendingTrade.collateralSymbol }}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Auto topup</td>
                                            <td>{{ lendingTrade.autoTopUp }}</td>
                                        </tr>
                                        <tr>
                                            <td>Age</td>
                                            <td>
                                                <span
                                                    v-b-tooltip.hover
                                                    :title="$moment(lendingTrade.createdAt).format('lll')">
                                                    {{ $moment(lendingTrade.createdAt).fromNow() }}</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
            title: 'Order ' + this.$route.params.slug + ' detail'
        }
    },
    data () {
        return {
            hash: null,
            lendingTrade: {},
            loading: true
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
                name: 'lending-trades-slug',
                to: { name: 'lending-trades-slug', params: { slug: this.hash } }
            })

            const { data } = await this.$axios.get('/api/lending/trades/' + this.hash)

            this.lendingTrade = data

            this.loading = false
        } catch (error) {
            console.log(error)
        }
    }
}
</script>
