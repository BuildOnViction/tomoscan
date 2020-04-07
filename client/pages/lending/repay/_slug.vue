<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <h3 class="tomo-headline">
            <span class="mr-2">Lending Order Hash:</span>
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
                                                    :to="{name: 'txs-slug', params: {slug: lendingOrder.txHash}}">
                                                    <read-more
                                                        :text="lendingOrder.txHash"
                                                        class="d-sm-none" />
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
                                            <td>Lending Repay Status</td>
                                            <td>
                                                <span
                                                    v-if="lendingOrder.status === 'REPAY'"
                                                    class="text-success">Repay</span>
                                                <span
                                                    v-else-if="lendingOrder.status === 'REJECTED'"
                                                    class="text-danger">Rejected</span>
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
                                            <td>Lending token</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{name: 'tokens-slug',
                                                          params: {slug: lendingOrder.lendingToken.toLowerCase()}}">
                                                    {{ lendingOrder.lendingToken.toLowerCase() }}</nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Collateral token</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{name: 'tokens-slug',
                                                          params: {slug: lendingOrder.collateralToken.toLowerCase()}}">
                                                    {{ lendingOrder.lendingToken.toLowerCase() }}</nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Quantity</td>
                                            <td>
                                                {{ formatNumber(lendingOrder.quantity) }}
                                                {{ lendingOrder.lendingSymbol }}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Interest</td>
                                            <td>{{ lendingOrder.interest }} %</td>
                                        </tr>
                                        <tr>
                                            <td>Filled Amount</td>
                                            <td>
                                                {{ lendingOrder.filledAmount === null ? 0:
                                                formatNumber(lendingOrder.filledAmount) }}
                                                {{ lendingOrder.lendingSymbol }}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Auto topup</td>
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
            lendingOrder: {},
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
                name: 'lending-repay-slug',
                to: { name: 'lending-repay-slug', params: { slug: this.hash } }
            })

            const { data } = await this.$axios.get('/api/lending/repay/' + this.hash)

            this.lendingOrder = data

            this.loading = false
        } catch (error) {
            console.log(error)
        }
    }
}
</script>
