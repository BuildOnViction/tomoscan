<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card tomo-card--address">
            <div class="tomo-card__header">
                <h3
                    :class="`tomo-card__headline
                    ${(address && address.isContract ? ' tomo-card__headline--is-contract' : '')}`">
                    <span v-if="address && address.isContract">Contract: </span>
                    <read-more
                        :text="hash"
                        class="d-sm-none" />
                    <read-more
                        :text="hash"
                        :max-chars="20"
                        class="d-none d-sm-inline-block d-lg-none" />
                    <read-more
                        :text="hash"
                        :max-chars="30"
                        class="d-none d-lg-inline-block d-xl-none" />
                    <span class="d-none d-xl-inline-block">{{ hash }}</span>
                </h3>
            </div>
            <div class="tomo-card__body">
                <table class="tomo-card__table">
                    <tbody>
                        <tr>
                            <td>TOMO Balance</td>
                            <td>
                                <span>{{ formatUnit(toEther(address.balance)) }}</span>
                            </td>
                        </tr>
                        <tr>
                            <td>TOMO USD Value</td>
                            <td>
                                <span>{{ formatNumber(usdPrice * toEtherNumber(address.balance)) }}</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Transactions</td>
                            <td>
                                <span>{{ formatNumber(address.transactionCount) }}</span> txns
                            </td>
                        </tr>
                        <tr v-if="address && !address.isContract">
                            <td>Code</td>
                            <td>
                                <read-more
                                    :text="address.code"
                                    class="d-sm-none" />
                                <read-more
                                    :text="address.code"
                                    :max-chars="20"
                                    class="d-none d-sm-inline-block d-lg-none" />
                                <read-more
                                    :text="address.code"
                                    :max-chars="30"
                                    class="d-none d-lg-inline-block d-xl-none" />
                                <span class="d-none d-xl-inline-block">{{ address.code }}</span>
                            </td>
                        </tr>
                        <tr v-if="address && address.token">
                            <td>Token Contract</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'tokens-slug', params: {slug: address.token.hash}}"
                                    class="pull-right text-right">
                                    {{ address.token.name }}({{ address.token.symbol }})
                                </nuxt-link>
                            </td>
                        </tr>
                        <tr v-if="address && address.contractCreation">
                            <td>Contract Creator</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'address-slug', params: {slug: address.contractCreation}}"
                                    class="text-truncate">{{ address.contractCreation }}</nuxt-link>
                                <span>&nbsp;at txns&nbsp;</span>
                                <span v-if="address.fromTxn">
                                    <nuxt-link
                                        :to="{name: 'txs-slug', params: {slug: address.fromTxn}}"
                                        class="text-truncate">{{ address.fromTxn }}</nuxt-link>
                                </span>
                            </td>
                        </tr>
                        <tr
                            v-if="address && address.isContract && ! address.contract"
                            class="is-contract-message">
                            <td>
                                <div>Are you the contract creator?
                                    <nuxt-link :to="{name: 'contracts-verify', query: {address: hash}}">
                                        Verify And Publish
                                    </nuxt-link>
                                    your contract source code today!
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="text-center text-lg-right tomo-qrcode">
                    <vue-qrcode
                        :value="hash"
                        :options="{size: 250}"
                        class="img-fluid"/>
                </div>
            </div>
        </div>

        <b-tabs
            ref="allTabs"
            v-model="tabIndex"
            class="tomo-tabs">
            <b-tab
                id="transactions"
                :title="'Transactions (' + formatNumber(txsCount) + ')'"
                href="#transactions"
                @click="onClick">
                <table-tx
                    :address="hash"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="!address.isContract"
                :title="'Mined Blocks (' + formatNumber(blocksCount) + ')'"
                href="#minedBlocks"
                @click="onClick">
                <table-tx-by-account :page="this"/>
            </b-tab>
            <b-tab
                v-if="address && address.hashTokens"
                :title="'Token Holding (' + formatNumber(tokensCount) + ')'"
                @click="onClick">
                <table-tokens-by-account
                    :address="hash"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="address && address.isContract"
                title="Code"
                href="#code"
                @click="refreshCodeMirror">
                <read-source-code
                    ref="readSourceCode"
                    :token="hash"
                    :smartcontract="smartContract"
                    :address="address"/>
            </b-tab>
            <b-tab
                v-if="address && address.isContract && smartContract"
                title="Read Contract"
                href="readContract"
                @click="onClick">
                <read-contract
                    :contract="hash"/>
            </b-tab>
            <b-tab
                :title="'Events (' + formatNumber(eventsCount) + ')'"
                href="#events"
                @click="onClick">
                <table-event
                    :address="hash"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="hasReward && !address.isContract"
                :title="'Rewards (' + formatNumber(rewardTime) + ')'"
                href="#rewards"
                @click="onClick">
                <table-reward
                    :address="hash"
                    :page="this"/>
            </b-tab>
        </b-tabs>
    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import TableTx from '~/components/TableTx'
import TableTokensByAccount from '~/components/TableTokensByAccount'
import TableTxByAccount from '~/components/TableTxByAccount'
import TableEvent from '~/components/TableEvent'
import ReadMore from '~/components/ReadMore'
import VueQrcode from '@xkeshi/vue-qrcode'
import ReadContract from '~/components/ReadContract'
import TableReward from '~/components/TableReward'
import ReadSourceCode from '~/components/ReadSourceCode'

export default {
    components: {
        ReadSourceCode,
        TableTx,
        TableTokensByAccount,
        TableTxByAccount,
        TableEvent,
        ReadMore,
        VueQrcode,
        ReadContract,
        TableReward
    },
    mixins: [mixin],
    head () {
        return {
            title: 'Address ' + this.hash
        }
    },
    data: () => ({
        hash: null,
        address: null,
        smartContract: null,
        txsCount: 0,
        blocksCount: 0,
        eventsCount: 0,
        tokensCount: 0,
        loading: true,
        hasReward: true,
        rewardTime: 0,
        tabIndex: 0
    }),
    computed: {
        usdPrice () {
            return this.$store.state.app.usdPrice
        },
        codemirror () {
            return [
                this.$refs.tomoCmSourceCode.codemirror,
                this.$refs.tomoCmAbiCode.codemirror,
                this.$refs.tomoCmCode.codemirror
            ]
        }
    },
    watch: {
        $route (to, from) {
            if (window.location.hash) {
                this.updateHashChange()
            }
        }
    },
    created () {
        let hash = this.$route.params.slug
        if (hash) {
            this.hash = hash
        }
    },
    updated () {
        if (window.location.hash) {
            this.updateHashChange()
        }
    },
    mounted () {
        let self = this

        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', {
            name: 'address-slug',
            to: { name: 'address-slug', params: { slug: self.hash } }
        })

        self.getAccountFromApi()
        self.getUSDPrice()
    },
    methods: {
        async getAccountFromApi () {
            let self = this

            self.loading = true

            let { data } = await this.$axios.get('/api/accounts/' + self.hash)
            self.address = data
            self.smartContract = data.contract

            self.loading = false
        },
        async getUSDPrice () {
            let self = this

            self.$store.dispatch('app/getUSDPrice')
        },
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
        onClick () {
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
