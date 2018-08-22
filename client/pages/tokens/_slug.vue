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
                                    <td>Total Supply</td>
                                    <td>{{ formatUnit(formatNumber(token.totalSupplyNumber), symbol) }}</td>
                                </tr>
                                <tr>
                                    <td>Transfers</td>
                                    <td>{{ formatNumber(token.tokenTxsCount) }}</td>
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
                            :page="this"/>
                    </b-tab>
                    <b-tab :title="'Token Holders (' + holdersCount + ')'">
                        <table-token-holder
                            :address="hash"
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
import TableTokenHolder from '~/components/TableTokenHolder'

export default {
    components: {
        TableTokenTx,
        TableTokenHolder
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
            holdersCount: 0
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
            name: 'tokens-slug',
            to: { name: 'tokens-slug', params: { slug: self.hash } }
        })

        let { data } = await self.$axios.get('/api/tokens/' + self.hash)
        self.token = data
        self.tokenName = data.name
        self.symbol = data.symbol

        self.loading = false
    }
}
</script>
