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
                                    :to="{name: 'lending-trades-slug', params: {slug: lendingTopup.hash}}">
                                    <read-more
                                        :text="lendingTopup.hash"
                                        class="d-sm-none"/>
                                    <read-more
                                        :text="lendingTopup.hash"
                                        :max-chars="20"
                                        class="d-none d-sm-block d-md-none"/>
                                    <read-more
                                        :text="lendingTopup.hash"
                                        :max-chars="40"
                                        class="d-none d-md-block d-lg-none"/>
                                    <span class="d-none d-lg-block">{{ lendingTopup.hash }}</span>

                                </nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>Lending Topup Status</td>
                            <td>
                                <span
                                    v-if="lendingTopup.status === 'TOPUP'"
                                    class="text-success">Topup</span>
                                <span
                                    v-else-if="lendingTopup.status === 'REJECTED'"
                                    class="text-danger">Rejected</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Dex address</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'address-slug', params: {slug:lendingTopup.relayer.toLowerCase()}}"
                                    class="mr-1">{{ lendingTopup.relayer.toLowerCase() }}</nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>User address</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'address-slug',
                                          params: {slug:lendingTopup.userAddress.toLowerCase()}}"
                                    class="mr-1">{{ lendingTopup.userAddress.toLowerCase() }}
                                </nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>Lending token</td>
                            <td>
                                <nuxt-link
                                    v-if="lendingTopup.lendingToken !== tomoNativeToken"
                                    :to="{name: 'tokens-slug',
                                          params: {slug: lendingTopup.lendingToken.toLowerCase()}}">
                                    {{ lendingTopup.lendingToken.toLowerCase() }}</nuxt-link>
                                <span v-else>TOMO</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Collateral token</td>
                            <td>
                                <nuxt-link
                                    v-if="lendingTopup.collateralToken !== tomoNativeToken"
                                    :to="{name: 'tokens-slug',
                                          params: {slug: lendingTopup.collateralToken.toLowerCase()}}">
                                    {{ lendingTopup.collateralToken.toLowerCase() }}</nuxt-link>
                                <span v-else>TOMO</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Quantity</td>
                            <td>
                                {{ formatNumber(lendingTopup.quantity) }}
                                <nuxt-link
                                    v-if="lendingTopup.collateralToken !== tomoNativeToken"
                                    :to="{name: 'tokens-slug',
                                          params: {slug: lendingTopup.collateralToken}}">
                                    {{ lendingTopup.collateralSymbol.toUpperCase() }}</nuxt-link>
                                <span v-else>TOMO</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Auto</td>
                            <td>{{ lendingTopup.autoTopUp }}</td>
                        </tr>
                        <tr>
                            <td>Age</td>
                            <td>
                                <span
                                    v-b-tooltip.hover
                                    :title="$moment(lendingTopup.createdAt).format('lll')">
                                    {{ $moment(lendingTopup.createdAt).fromNow() }}</span>
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
            lendingTopup: {},
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
                name: 'lending-topup-slug',
                to: { name: 'lending-topup-slug', params: { slug: this.hash } }
            })

            const { data } = await this.$axios.get('/api/lending/topup/' + this.hash)

            this.lendingTopup = data

            this.loading = false
        } catch (error) {
            console.log(error)
        }
    },
    head () {
        return {
            title: 'Lending Topup ' + this.$route.params.slug + ' detail'
        }
    }
}
</script>
