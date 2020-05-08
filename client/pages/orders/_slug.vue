<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <h3 class="tomo-headline">
            <span class="mr-2">Order Hash:</span>
            <read-more
                :text="hash"
                class="d-sm-none"/>
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
                                            <td>Order Hash</td>
                                            <td>{{ order.hash }}</td>
                                        </tr>
                                        <tr>
                                            <td>Tx Hash</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{name: 'txs-slug', params: {slug:order.txHash}}">
                                                    {{ order.txHash }}</nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Order Status</td>
                                            <td>
                                                <span
                                                    v-if="order.status === 'FILLED'"
                                                    class="text-success">Filled</span>
                                                <span
                                                    v-else-if="order.status === 'CANCELLED'"
                                                    class="text-danger">Cancelled</span>
                                                <span
                                                    v-else-if="order.status === 'OPEN'"
                                                    class="text-info">Open</span>
                                                <span
                                                    v-else-if="order.status === 'REJECTED'"
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
                                                          params: {slug:order.exchangeAddress.toLowerCase()}}"
                                                    class="mr-1">{{ order.exchangeAddress.toLowerCase() }}</nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>User address</td>
                                            <td>
                                                <nuxt-link
                                                    :to="{name: 'address-slug',
                                                          params: {slug:order.userAddress.toLowerCase()}}"
                                                    class="mr-1">{{ order.userAddress.toLowerCase() }}</nuxt-link>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Type</td>
                                            <td>{{ order.type === 'LO' ? 'Limit' : 'Market' }}</td>
                                        </tr>
                                        <tr>
                                            <td>Side</td>
                                            <td>{{ order.side }}</td>
                                        </tr>
                                        <tr>
                                            <td>Pair name</td>
                                            <td>
                                                <span>
                                                    <nuxt-link
                                                        v-if="order.baseToken !== tomoNativeToken"
                                                        :to="{name: 'tokens-slug',
                                                              params: {slug: order.baseToken}}">
                                                        {{ order.baseSymbol }}</nuxt-link>
                                                    <span v-else>
                                                        {{ order.baseSymbol }}</span>/<nuxt-link
                                                        v-if="order.quoteToken !== tomoNativeToken"
                                                        :to="{name: 'tokens-slug',
                                                              params: {slug: order.quoteToken}}">
                                                        {{ order.quoteSymbol }}</nuxt-link>
                                                    <span v-else>{{ order.quoteSymbol }}</span>
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Price</td>
                                            <td>{{ order.price }} {{ order.quoteSymbol }}</td>
                                        </tr>
                                        <tr>
                                            <td>Order Amount</td>
                                            <td>{{ order.quantity }} {{ order.baseSymbol }}</td>
                                        </tr>
                                        <tr>
                                            <td>Filled Amount</td>
                                            <td>{{ order.filledAmount }} {{ order.baseSymbol }}</td>
                                        </tr>
                                        <tr v-if="order.cancelFee">
                                            <td>Cancel Fee</td>
                                            <td>{{ order.cancelFee }}
                                                {{ order.side === 'BUY' ? order.quoteSymbol : order.baseSymbol }}</td>
                                        </tr>
                                        <tr>
                                            <td>Age</td>
                                            <td>
                                                <span
                                                    v-b-tooltip.hover
                                                    :title="$moment(order.createdAt).format('lll')">
                                                    {{ $moment(order.createdAt).fromNow() }}</span>
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
import ReadMore from '~/components/ReadMore'

export default {
    components: {
        ReadMore
    },
    mixins: [mixin],
    data () {
        return {
            hash: null,
            order: {},
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
                name: 'orders-slug',
                to: { name: 'orders-slug', params: { slug: this.hash } }
            })

            const { data } = await this.$axios.get('/api/orders/' + this.hash)

            this.order = data

            this.loading = false
        } catch (error) {
            console.log(error)
        }
    },
    head () {
        return {
            title: 'Order ' + this.$route.params.slug + ' detail'
        }
    }
}
</script>
