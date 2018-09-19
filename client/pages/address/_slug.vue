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
                :title="'Transactions (' + txsCount + ')'"
                href="#transactions">
                <table-tx
                    :address="hash"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="!address.isContract"
                :title="'Mined Blocks (' + blocksCount + ')'"
                href="#minedBlocks">
                <table-tx-by-account :page="this"/>
            </b-tab>
            <b-tab
                v-if="address && address.hashTokens"
                :title="'Token Holding (' + tokensCount + ')'">
                <table-tokens-by-account
                    :address="hash"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="address && address.isContract"
                title="Code"
                href="#code"
                @click="refreshCodemirror">
                <section v-if="smartContract">
                    <h5 class="mb-4">
                        <i class="fa fa-check-circle-o text-success mr-2"/>Contract Source Code Verified
                    </h5>
                    <b-row class="mb-3">
                        <b-col sm="6">
                            <b-table
                                :items="[
                                    {key: 'Contract Name', value: smartContract.contractName},
                                    {key: 'Compiler Version', value: smartContract.compiler},
                                ]"
                                class="tomo-table tomo-table--verified-contract"
                                thead-class="d-none"/>
                        </b-col>

                        <b-col sm="6">
                            <b-table
                                :items="[
                                    {key: 'Verified At', value: $moment(smartContract.createdAt).format('lll')},
                                    {key: 'Optimization Enabled', value: smartContract.optimization ? 'Yes' : 'No'},
                                ]"
                                class="tomo-table tomo-table--verified-contract"
                                thead-class="d-none" />
                        </b-col>
                    </b-row>

                    <b-form-group>
                        <label>Contract Source Code<i class="fa fa-code ml-1"/></label>
                        <div
                            id="code-actions--source"
                            class="code-actions">
                            <button
                                v-clipboard="smartContract.sourceCode"
                                class="btn btn-sm mr-2 code-actions__copy"
                                @success="copyCode"><i class="fa fa-copy mr-1" />Copy</button>
                            <button
                                class="btn btn-sm code-actions__toggle"
                                data-mode="light"
                                @click="toggleMode"><i class="fa fa-adjust mr-1" />Dark Mode</button>
                        </div>
                        <no-ssr placeholder="Codemirror Loading...">
                            <codemirror
                                ref="tomoCmSourceCode"
                                :value="smartContract.sourceCode" />
                        </no-ssr>
                    </b-form-group>

                    <b-form-group>
                        <label>Contract ABI<i class="fa fa-cogs ml-1"/></label>
                        <div
                            id="code-actions--abi"
                            class="code-actions">
                            <button
                                v-clipboard="smartContract.abiCode"
                                class="btn btn-sm mr-2 code-actions__copy"
                                @success="copyCode"><i class="fa fa-copy mr-1" />Copy</button>
                            <button
                                id="btn-abi-code"
                                class="btn btn-sm code-actions__toggle"
                                data-mode="light"
                                @click="toggleMode"><i class="fa fa-adjust mr-1" />Dark Mode</button>
                        </div>
                        <no-ssr placeholder="Codemirror Loading...">
                            <codemirror
                                ref="tomoCmAbiCode"
                                :value="smartContract.abiCode"
                                :options="{mode:'application/ld+json',styleActiveLine:false}" />
                        </no-ssr>
                    </b-form-group>
                </section>

                <b-form-group>
                    <label>Contract Creation Code</label>
                    <div
                        id="code-actions--creation"
                        class="code-actions">
                        <button
                            v-clipboard="address.code"
                            class="btn btn-sm mr-2 code-actions__copy"
                            @success="copyCode"><i class="fa fa-copy mr-1" />Copy</button>
                        <button
                            id="btn-code"
                            class="btn btn-sm code-actions__toggle"
                            data-mode="light"
                            @click="toggleMode"><i class="fa fa-adjust mr-1" />Dark Mode</button>
                    </div>
                    <no-ssr placeholder="Codemirror Loading...">
                        <codemirror
                            ref="tomoCmCode"
                            :value="address.code"
                            :options="{mode:'application/ld+json',styleActiveLine:false}" />
                    </no-ssr>
                </b-form-group>
            </b-tab>
            <b-tab
                v-if="address && address.isContract && smartContract"
                title="Read Contract"
                href="readContract">
                <read-contract/>
            </b-tab>
            <b-tab
                :title="'Events (' + eventsCount + ')'"
                href="#events">
                <table-event
                    :address="hash"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="hasReward && !address.isContract"
                :title="'Rewards (' + rewardTime + ')'"
                href="#rewards">
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

export default {
    components: {
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
        tabIndex (value) {
            const allTabs = this.$refs.allTabs
            const location = window.location
            location.hash = allTabs.tabs[value].href
        }
    },
    created () {
        let hash = this.$route.params.slug
        if (hash) {
            this.hash = hash
        }
    },
    updated () {
        const allTabs = this.$refs.allTabs
        if (this.$route.hash) {
            allTabs.tabs.forEach((i, index) => {
                if (i.href === this.$route.hash) {
                    this.tabIndex = index
                }
                return true
            })
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
        refreshCodemirror () {
            this.$nextTick(() => {
                for (const $ref in this.$refs) {
                    if (this.$refs[$ref].hasOwnProperty('codemirror')) {
                        this.$refs[$ref].codemirror.refresh()
                    }
                }
            })
        },
        copyCode (e) {
            let id = e.trigger.parentNode.id
            let msg = ''

            if (id === 'code-actions--source') {
                msg = 'Source code copied to clipboard'
            }

            if (id === 'code-actions--abi') {
                msg = 'ABI code copied to clipboard'
            }

            if (id === 'code-actions--creation') {
                msg = 'Contract creation code copied to clipboard'
            }

            this.$toast.show(msg)
        },
        toggleMode (e) {
            let id = e.target.parentNode.id
            let mode = e.target.getAttribute('data-mode')
            let theme = mode === 'light' ? 'base16-dark' : 'eclipse'

            if (id === 'code-actions--source') {
                this.$refs.tomoCmSourceCode.codemirror.setOption('theme', theme)
            }

            if (id === 'code-actions--abi') {
                this.$refs.tomoCmAbiCode.codemirror.setOption('theme', theme)
            }

            if (id === 'code-actions--creation') {
                this.$refs.tomoCmCode.codemirror.setOption('theme', theme)
            }

            e.target.innerHTML = (mode === 'light')
                ? '<i class="fa fa-adjust mr-1"></i> Light Mode' : '<i class="fa fa-adjust mr-1"></i> Dark Mode'
            mode = (mode === 'light') ? 'dark' : 'light'
            e.target.setAttribute('data-mode', mode)
        }
    }
}
</script>
