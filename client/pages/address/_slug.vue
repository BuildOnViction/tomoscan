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
                        :text="address.hash"
                        class="d-sm-none" />
                    <read-more
                        :text="address.hash"
                        :max-chars="20"
                        class="d-none d-sm-inline-block d-lg-none" />
                    <read-more
                        :text="address.hash"
                        :max-chars="30"
                        class="d-none d-lg-inline-block d-xl-none" />
                    <span class="d-none d-xl-inline-block">{{ address.hash }}</span>
                </h3>
            </div>
            <div class="tomo-card__body">
                <table class="tomo-card__table">
                    <tbody>
                        <tr v-if="address.accountName">
                            <td>Account Name</td>
                            <td>
                                <span>{{ address.accountName }}</span>
                            </td>
                        </tr>
                        <tr>
                            <td>TOMO Balance</td>
                            <td>
                                <span>{{ formatUnit(toTomo(address.balance, 18)) }}</span>
                            </td>
                        </tr>
                        <tr>
                            <td>TOMO USD Value</td>
                            <td>
                                <span>{{ formatNumber(usdPrice * toTomoNumber(address.balance)) }} (price from
                                    <a
                                        target="_blank"
                                        href="https://www.coingecko.com/en/coins/tomochain">CoinGecko</a>)</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Transactions</td>
                            <td>
                                <span>{{ formatNumber(totalTxsCount) }}</span> txns
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
                                    :to="{name: 'tokens-slug', params: {slug: address.token.hash}}">
                                    {{ trimWord(address.token.name) }}({{ trimWord(address.token.symbol) }})
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
                    <div>
                        <button
                            v-clipboard="address.hash"
                            type="button"
                            class="btn btn-sm mr-2 code-actions__copy"
                            @success="copyAddress">
                            <i class="fa fa-clipboard"/> Copy
                        </button>
                    </div>
                    <div>
                        <vue-qrcode
                            :value="address.hash"
                            :options="{size: 250}"
                            class="img-fluid"/>
                    </div>
                </div>
            </div>
        </div>

        <b-tabs
            ref="allTabs"
            v-model="tabIndex"
            class="tomo-tabs"
            @input="onSwitchTab">
            <!--:title="'In Transactions (' + formatNumber(inTxsCount) + ')'"-->
            <b-tab
                id="inTransactions"
                title="In Transactions"
                href="#inTransactions">
                <table-tx-by-account
                    :address="hash"
                    :type="'in'"
                    :parent="'#inTransactions'"
                    :page="this"/>
            </b-tab>
            <!--:title="'Out Transactions (' + formatNumber(outTxsCount) + ')'"-->
            <b-tab
                v-if="!address.isContract"
                id="outTransactions"
                title="Out Transactions"
                href="#outTransactions">
                <table-tx-by-account
                    :address="hash"
                    :type="'out'"
                    :parent="'#outTransactions'"
                    :page="this"/>
            </b-tab>
            <!--:title="'Internal Transactions (' + formatNumber(internalTxsCount) + ')'"-->
            <b-tab
                id="internalTransactions"
                title="Internal Transactions"
                href="#internalTransactions">
                <table-internal-tx
                    :address="hash"
                    :parent="'#internalTransactions'"
                    :page="this"/>
            </b-tab>
            <!--:title="'Created Blocks (' + formatNumber(blocksCount) + ')'"-->
            <b-tab
                v-if="!address.isContract"
                id="minedBlocks"
                title="Created Blocks"
                href="#minedBlocks">
                <table-block-by-account
                    :address="hash"
                    :page="this"
                    :parent="'minedBlocks'"/>
            </b-tab>
            <!--:title="'Token Holding (' + formatNumber(tokensCount) + ')'"-->
            <b-tab
                v-if="address && address.hasTrc20"
                id="trc20Holding"
                title="TRC20 Holding"
                href="#trc20Holding">
                <table-tokens-by-account
                    :holder="hash"
                    :token_type="'trc20'"
                    :parent="'trc20Holding'"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="address && address.hasTrc21"
                id="trc21Holding"
                title="TRC21 Holding"
                href="#trc21Holding">
                <table-tokens-by-account
                    :holder="hash"
                    :token_type="'trc21'"
                    :parent="'trc21Holding'"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="address && address.hasTrc721"
                id="trc721Inventory"
                title="TRC721 Inventory"
                href="#trc721Inventory">
                <table-tokens-by-account
                    :holder="hash"
                    :token_type="'trc721'"
                    :parent="'trc721Inventory'"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="address && address.isContract && smartContract"
                id="code"
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
                id="readContract"
                title="Read Contract"
                href="#readContract">
                <read-contract
                    :contract="hash"/>
            </b-tab>
            <!--:title="'Events (' + formatNumber(eventsCount) + ')'"-->
            <b-tab
                v-if="!address.isContract"
                id="events"
                title="Events"
                href="#events">
                <table-event
                    :address="hash"
                    :parent="'events'"
                    :page="this"/>
            </b-tab>
            <!--:title="'Rewards (' + formatNumber(rewardTime) + ')'"-->
            <b-tab
                v-if="hasReward && !address.isContract"
                id="rewards"
                title="Rewards"
                href="#rewards">
                <table-reward
                    :address="hash"
                    :parent="'rewards'"
                    :page="this"/>
            </b-tab>
        </b-tabs>
    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import TableTx from '~/components/TableTx'
import TableTxByAccount from '~/components/TableTxByAccount'
import TableInternalTx from '~/components/TableInternalTx'
import TableTokenTx from '~/components/TableTokenTx'
import TableTokensByAccount from '~/components/TableTokensByAccount'
import TableBlockByAccount from '~/components/TableBlockByAccount'
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
        TableTxByAccount,
        TableInternalTx,
        TableTokenTx,
        TableTokensByAccount,
        TableBlockByAccount,
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
        inTxsCount: 0,
        outTxsCount: 0,
        tokenTxsCount: 0,
        internalTxsCount: 0,
        contractTxsCount: 0,
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
        },
        hashTab () {
            return this.$route.hash || '#inTransactions'
        }
    },
    created () {
        let hash = this.$route.params.slug
        if (hash) {
            this.hash = hash.toLowerCase()
        }
    },
    mounted () {
        try {
            let self = this

            // Init breadcrumbs data.
            this.$store.commit('breadcrumb/setItems', {
                name: 'address-slug',
                to: { name: 'address-slug', params: { slug: self.hash } }
            })

            self.getAccountFromApi()
            self.getUSDPrice()
        } catch (error) {
            console.log(error)
        }
    },
    methods: {
        async getAccountFromApi () {
            let self = this

            self.loading = true
            let params = {}

            if (self.hash) {
                params.address = self.hash
            }

            params.list = 'address'

            let query = this.serializeQuery(params)

            let responses = await Promise.all([
                this.$axios.get('/api/accounts/' + self.hash),
                this.$axios.get('/api/counting' + '?' + query)
            ])

            self.address = responses[0].data
            self.smartContract = responses[0].data.contract

            self.blocksCount = responses[1].data.minedBlocks

            self.eventsCount = responses[1].data.events

            self.inTxsCount = responses[1].data.inTxes
            self.outTxsCount = responses[1].data.outTxes
            self.internalTxsCount = responses[1].data.internalTxes
            self.contractTxsCount = responses[1].data.contractTxes
            self.totalTxsCount = responses[1].data.totalTxes

            self.rewardTime = responses[1].data.rewards

            self.tokensCount = responses[1].data.tokenHolders

            self.loading = false
        },
        async getUSDPrice () {
            let self = this

            self.$store.dispatch('app/getUSDPrice')
        },
        onSwitchTab: function () {
            const allTabs = this.$refs.allTabs
            const location = window.location
            const value = this.tabIndex
            if (allTabs) {
                // if (location.hash !== allTabs.tabs[value].href) {
                //     this.$router.replace({
                //         hash: allTabs.tabs[value].href
                //     })
                // } else {
                location.hash = allTabs.tabs[value].href
                // }
            }
        },
        copyAddress () {
            this.$toast.show('Copied')
        }
    }
}
</script>
