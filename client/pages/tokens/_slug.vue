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
                                    <td>Price</td>
                                    <td>$0.0000 @ 0.0000000 TOMO</td>
                                </tr>
                                <tr>
                                    <td>Holders</td>
                                    <td>2000 address</td>
                                </tr>
                                <tr>
                                    <td>Transfers</td>
                                    <td>{{ formatNumber(token.tokenTxsCount) }}</td>
                                </tr>
                                <tr>
                                    <td>Official Site</td>
                                    <td>x</td>
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
                                <tr>
                                    <td>Links</td>
                                    <td>
                                        <ul
                                            class="list-inline s-icons"
                                            style="margin-bottom:-7px">
                                            <li class="list-inline-item">
                                                <a
                                                    href="mailto:info@token.com">
                                                    <i class="fa fa-envelope"/>
                                                </a>
                                            </li>
                                            <li class="list-inline-item"><a
                                                target="_blank"
                                                href="https://medium.com/">
                                                <i class="fa fa-pencil-square-o"/>
                                            </a></li>
                                            <li class="list-inline-item"><a
                                                target="_blank"
                                                href="https://www.facebook.com/">
                                                <i class="fa fa-facebook"/>
                                            </a></li>
                                            <li class="list-inline-item"><a
                                                target="_blank"
                                                href="https://twitter.com/">
                                                <i class="fa fa-twitter"/>
                                            </a></li>
                                            <li class="list-inline-item"><a
                                                target="_blank"
                                                href="https://bitcointalk.org/index.php?topic=">
                                                <i class="fa fa-btc"/>
                                            </a></li>
                                            <li class="list-inline-item"><a
                                                target="_blank"
                                                href="https://github.com/">
                                                <i class="fa fa-github"/>
                                            </a></li>
                                            <li class="list-inline-item"><a
                                                target="_blank"
                                                href="https://t.me/">
                                                <i class="fa fa-telegram"/>
                                            </a></li>
                                            <li class="list-inline-item"><a
                                                target="_blank"
                                                href="">
                                                <i class="fa fa-file-text-o"/>
                                            </a></li>
                                            <li class="list-inline-item"><a
                                                target="_blank"
                                                href="https://coinmarketcap.com/currencies//">
                                                <i class="fa fa-bar-chart"/>
                                            </a></li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Filtered By</td>
                                    <td>
                                        <input
                                            type="text"
                                            class="form-control-sm"
                                            placeholder="Address">
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
