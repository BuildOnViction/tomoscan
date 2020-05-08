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
                            <td>Lending trade</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'lending-trades-slug', params: {slug: lendingRepay.hash}}">
                                    <read-more
                                        :text="lendingRepay.hash"
                                        class="d-sm-none"/>
                                    <read-more
                                        :text="lendingRepay.hash"
                                        :max-chars="20"
                                        class="d-none d-sm-block d-md-none"/>
                                    <read-more
                                        :text="lendingRepay.hash"
                                        :max-chars="40"
                                        class="d-none d-md-block d-lg-none"/>
                                    <span class="d-none d-lg-block">{{ lendingRepay.hash }}</span>

                                </nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>Lending Repay Status</td>
                            <td>
                                <span
                                    v-if="lendingRepay.status === 'REPAY'"
                                    class="text-success">Repay</span>
                                <span
                                    v-else-if="lendingRepay.status === 'REJECTED'"
                                    class="text-danger">Rejected</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Dex address</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'address-slug',
                                          params: {slug:lendingRepay.relayer.toLowerCase()}}"
                                    class="mr-1">{{ lendingRepay.relayer.toLowerCase() }}</nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>User address</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'address-slug',
                                          params: {slug:lendingRepay.userAddress.toLowerCase()}}"
                                    class="mr-1">{{ lendingRepay.userAddress.toLowerCase() }}
                                </nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>Lending token</td>
                            <td>
                                <nuxt-link
                                    v-if="lendingRepay.lendingToken !== tomoNativeToken"
                                    :to="{name: 'tokens-slug',
                                          params: {slug: lendingRepay.lendingToken.toLowerCase()}}">
                                    {{ lendingRepay.lendingToken.toLowerCase() }}</nuxt-link>
                                <span v-else>TOMO</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Collateral token</td>
                            <td>
                                <nuxt-link
                                    v-if="lendingRepay.collateralToken !== tomoNativeToken"
                                    :to="{name: 'tokens-slug',
                                          params: {slug: lendingRepay.collateralToken.toLowerCase()}}">
                                    {{ lendingRepay.collateralToken.toLowerCase() }}</nuxt-link>
                                <span v-else>TOMO</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Quantity</td>
                            <td>
                                {{ formatNumber(lendingRepay.quantity) }}
                                <nuxt-link
                                    v-if="lendingRepay.lendingToken !== tomoNativeToken"
                                    :to="{name: 'tokens-slug',
                                          params: {slug: lendingRepay.lendingToken.toLowerCase()}}">
                                    {{ lendingRepay.lendingSymbol }}</nuxt-link>
                                <span v-else>TOMO</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Interest</td>
                            <td>{{ lendingRepay.interest }} %</td>
                        </tr>
                        <tr>
                            <td>Filled Amount</td>
                            <td>
                                {{ lendingRepay.filledAmount === null ? 0:
                                    formatNumber(lendingRepay.filledAmount) }}
                                <nuxt-link
                                    :to="{name: 'tokens-slug',
                                          params: {slug: lendingRepay.lendingToken.toLowerCase()}}">
                                    {{ lendingRepay.lendingSymbol }}</nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>Auto</td>
                            <td>{{ lendingRepay.autoTopUp }}</td>
                        </tr>
                        <tr>
                            <td>Age</td>
                            <td>
                                <span
                                    v-b-tooltip.hover
                                    :title="$moment(lendingRepay.createdAt).format('lll')">
                                    {{ $moment(lendingRepay.createdAt).fromNow() }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
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
            lendingRepay: {},
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
                name: 'lending-repay-slug',
                to: { name: 'lending-repay-slug', params: { slug: this.hash } }
            })

            const { data } = await this.$axios.get('/api/lending/repay/' + this.hash)

            this.lendingRepay = data

            this.loading = false
        } catch (error) {
            console.log(error)
        }
    },
    head () {
        return {
            title: 'Lending Repay ' + this.$route.params.slug + ' detail'
        }
    }
}
</script>
