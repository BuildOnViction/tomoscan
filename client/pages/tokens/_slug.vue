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
                                    <td>Holders</td>
                                    <td>{{ holdersCount }} {{ holdersCount > 1 ? 'addresses' : 'address' }}</td>
                                </tr>
                                <tr>
                                    <td>Transfers</td>
                                    <td>{{ formatNumber(tokenTxsCount) }}</td>
                                </tr>
                                <tr
                                    v-if="moreInfo">
                                    <td>Official Site</td>
                                    <td>
                                        <a
                                            :href="moreInfo.website"
                                            target="_blank"
                                            class="text-truncate">{{ moreInfo.website }}</a>
                                    </td>
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
                                            v-if="moreInfo && moreInfo.communities"
                                            class="list-inline s-icons">
                                            <li
                                                v-for="(community, key) in moreInfo.communities"
                                                :key="key"
                                                class="list-inline-item">
                                                <a
                                                    :title="community.title"
                                                    :href="community.url">
                                                    <i :class="community.icon"/>
                                                </a>
                                            </li>
                                        </ul>
                                        <span v-else>
                                            Not Available, Update ?
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Filtered By</td>
                                    <td>
                                        <div class="input-group input-group-sm mb-2">
                                            <input
                                                v-model="addressFilter"
                                                type="text"
                                                class="form-control"
                                                placeholder="Address"
                                                aria-label="Address">
                                            <div class="input-group-append">
                                                <button
                                                    :onclick="filterAddress()"
                                                    class="btn btn-primary"
                                                    type="button">Apply</button>
                                            </div>
                                        </div>
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
                    <b-tab
                        :title="'Token Holders (' + holdersCount + ')'">
                        <table-token-holder
                            :address="hash"
                            :page="this"/>
                    </b-tab>
                    <b-tab
                        v-if="address && address.isContract && smartContract"
                        title="Code"
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
                                            {
                                                key: 'Optimization Enabled',
                                                value: smartContract.optimization ? 'Yes' : 'No'
                                            },
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
                                        @success="copySourceCode"><i class="fa fa-copy mr-1" />Copy</button>
                                    <button
                                        class="btn btn-sm code-actions__toggle"
                                        data-mode="light"
                                        @click="darkLightMode"><i class="fa fa-adjust mr-1" />Dark Mode</button>
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
                                        @success="copySourceCode"><i class="fa fa-copy mr-1" />Copy</button>
                                    <button
                                        id="btn-abi-code"
                                        class="btn btn-sm code-actions__toggle"
                                        data-mode="light"
                                        @click="darkLightMode"><i class="fa fa-adjust mr-1" />Dark Mode</button>
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
                                    @success="copySourceCode"><i class="fa fa-copy mr-1" />Copy</button>
                                <button
                                    id="btn-code"
                                    class="btn btn-sm code-actions__toggle"
                                    data-mode="light"
                                    @click="darkLightMode"><i class="fa fa-adjust mr-1" />Dark Mode</button>
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
                        v-if="smartContract"
                        title="Read Contract">
                        <read-contract/>
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
import ReadContract from '~/components/ReadContract'

export default {
    components: {
        TableTokenTx,
        ReadContract,
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
            holdersCount: 0,
            moreInfo: null,
            addressFilter: null,
            address: null,
            smartContract: null,
            holderBalance: 0
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
        self.moreInfo = data.moreInfo
        self.getAccountFromApi()
    },
    methods: {
        async filterAddress () {

        },
        async getAccountFromApi () {
            let self = this

            let { data } = await this.$axios.get('/api/accounts/' + self.hash)
            self.address = data
            self.smartContract = data.contract
        },
        refreshCodemirror () {
            this.$nextTick(() => {
                for (const $ref in this.$refs) {
                    if (this.$refs[$ref].hasOwnProperty('codemirror')) {
                        this.$refs[$ref].codemirror.refresh()
                    }
                }
            })
        }
    }
}
</script>
