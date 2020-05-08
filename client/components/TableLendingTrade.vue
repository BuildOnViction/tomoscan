<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('lending trade', 'lending trades', total) }}</p>
        <form
            v-if="showFilter"
            class="form-inline mb-30 filter-box"
            method="get">
            <div class="form-group mr-2 mb-2">
                <input
                    id="inputUserAddress"
                    v-model="user"
                    name="user"
                    type="text"
                    class="form-control"
                    placeholder="User address">
            </div>
            <div class="form-group mr-2 mb-2">
                <input
                    id="lendingToken"
                    v-model="lendingToken"
                    name="lendingToken"
                    type="text"
                    class="form-control"
                    placeholder="Lending Token">
            </div>
            <div class="form-group mr-2 mb-2">
                <input
                    id="collateralToken"
                    v-model="collateralToken"
                    name="collateralToken"
                    type="text"
                    class="form-control"
                    placeholder="Collateral Token">
            </div>
            <div class="form-group mr-2 mb-2">
                <select
                    id="inputStatus"
                    v-model="status"
                    name="status"
                    class="form-control mx-sm-1">
                    <option
                        :selected="status === '' ? 'selected' : ''"
                        value=""
                        hidden
                        disabled>Select status</option>
                    <option value="">No filter</option>
                    <option
                        :selected="status === 'OPEN' ? 'selected' : ''"
                        value="OPEN">OPEN</option>
                    <option
                        :selected="status === 'FILLED' ? 'selected' : ''"
                        value="FILLED">FILLED</option>
                    <option
                        :selected="status === 'PARTIAL_FILLED' ? 'selected' : ''"
                        value="PARTIAL_FILLED">PARTIAL_FILLED</option>
                    <option
                        :selected="status === 'CANCELLED' ? 'selected' : ''"
                        value="CANCELLED">CANCELLED</option>
                    <option
                        :selected="status === 'REJECTED' ? 'selected' : ''"
                        value="REJECTED">REJECTED</option>
                </select>
            </div>
            <div class="form-group mr-2 mb-2">
                <button
                    type="submit"
                    class="btn btn-primary mr-sm-3">Filter</button>
            </div>
            <div class="form-group mr-2 mb-2">
                <button
                    type="button"
                    class="btn btn-secondary"
                    @click="reset">Reset</button>
            </div>
        </form>

        <div
            v-if="total === 0"
            class="tomo-empty">
            <i class="fa fa-exchange tomo-empty__icon"/>
            <p class="tomo-empty__description">No order found</p>
        </div>
        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--lending-trades">
            <template
                slot="hash"
                slot-scope="props">
                <i
                    v-if="props.item.status === 'FILLED'"
                    class="fa fa-check text-success ml-15"
                    aria-hidden="true"/>
                <i
                    v-if="props.item.status === 'CANCELLED'"
                    class="fa fa-ban text-danger ml-15"
                    aria-hidden="true"/>
                <nuxt-link
                    :to="{name: 'lending-trades-slug', params: {slug: props.item.hash.toLowerCase()}}">
                    {{ hiddenString(props.item.hash.toLowerCase(), 8) }}</nuxt-link>
            </template>
            <template
                slot="borrower"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.borrower.toLowerCase()}}">
                    {{ hiddenString(props.item.borrower.toLowerCase(), 8) }}</nuxt-link>
            </template>
            <template
                slot="investor"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.investor.toLowerCase()}}">
                    {{ hiddenString(props.item.investor.toLowerCase(), 8) }}</nuxt-link>
            </template>
            <template
                slot="collateralToken"
                slot-scope="props">
                {{ formatNumber(props.item.collateralLockedAmount) }}
                <nuxt-link
                    v-if="props.item.collateralToken !== tomoNativeToken"
                    :to="{name: 'tokens-slug',
                          params: {slug: props.item.collateralSymbol}}">
                    {{ props.item.collateralSymbol }}</nuxt-link>
                <span v-else>TOMO</span>
            </template>
            <template
                slot="lendingToken"
                slot-scope="props">
                {{ props.item.amount === null ? 0 : formatNumber(props.item.amount) }}
                <nuxt-link
                    v-if="props.item.lendingToken !== tomoNativeToken"
                    :to="{name: 'tokens-slug', params: {slug: props.item.lendingToken}}">
                    {{ props.item.lendingSymbol.toUpperCase() }}</nuxt-link>
                <span v-else>TOMO</span>
            </template>
            <template
                slot="borrowingFee"
                slot-scope="props">
                {{ props.item.borrowingFee === null ? 0 : formatNumber(props.item.borrowingFee) }}
                <nuxt-link
                    v-if="props.item.lendingToken !== tomoNativeToken"
                    :to="{name: 'tokens-slug', params: {slug: props.item.lendingToken}}">
                    {{ props.item.lendingSymbol.toUpperCase() }}</nuxt-link>
                <span v-else>TOMO</span>
            </template>
            <template
                slot="status"
                slot-scope="props">
                {{ props.item.status }}
            </template>
            <template
                slot="createdAt"
                slot-scope="props">
                <span
                    v-b-tooltip.hover
                    :title="$moment(props.item.createdAt).format('lll')">
                    {{ $moment(props.item.createdAt).fromNow() }}</span>
            </template>
        </table-base>

        <b-pagination
            v-if="total > 0 && total > perPage"
            v-model="currentPage"
            :total-rows="pages * perPage"
            :per-page="perPage"
            :limit="7"
            align="center"
            class="tomo-pagination"
            @change="onChangePaginate"/>
    </section>
</template>

<script>
import mixin from '~/plugins/mixin'
import TableBase from '~/components/TableBase'

export default {
    components: {
        TableBase
    },
    mixins: [mixin],
    props: {
        showFilter: {
            type: Boolean,
            default: false
        },
        orderHash: {
            type: String,
            default: ''
        },
        userAddress: {
            type: String,
            default: ''
        },
        txHash: {
            type: String,
            default: ''
        }
    },
    data: () => ({
        fields: {
            hash: { label: 'Hash' },
            borrower: { label: 'Borrower' },
            investor: { label: 'Investor' },
            lendingToken: { label: 'Lending Amount' },
            collateralToken: { label: 'Collateral Amount' },
            borrowingFee: { label: 'Fee' },
            status: { label: 'Status' },
            createdAt: { label: 'Age' }
        },
        loading: true,
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 20,
        pages: 1,
        blockNumber: null,
        user: '',
        lendingToken: '',
        collateralToken: '',
        status: '',
        tomoNativeToken: process.env.TOMO_NATIVE_TOKEN
    }),
    async created () {
        if (this.$route.query.user) {
            this.user = this.$route.query.user
        }
        if (this.$route.query.lendingToken) {
            this.lendingToken = this.$route.query.lendingToken
        }
        if (this.$route.query.collateralToken) {
            this.collateralToken = this.$route.query.collateralToken
        }
        if (this.$route.query.status) {
            this.status = this.$route.query.status
        }
        this.getDataFromApi()
    },
    methods: {
        async getDataFromApi () {
            const self = this

            self.loading = true
            const params = {
                page: self.currentPage,
                limit: self.perPage
            }
            // tab on address detail
            if (this.userAddress !== '') {
                params.user = this.userAddress

            // tab on lending order
            } else if (this.orderHash !== '') {
                params.orderHash = this.orderHash

            // tab on tx detail
            } else if (this.txHash !== '') {
                params.txHash = this.txHash
            } else {
                if (this.user !== '') {
                    params.user = this.user.trim()
                }
                if (this.lendingToken !== '') {
                    params.lendingToken = this.lendingToken
                }
                if (this.collateralToken !== '') {
                    params.collateralToken = this.collateralToken
                }
                if (this.status !== '') {
                    params.status = this.status
                }
            }

            const query = this.serializeQuery(params)
            const { data } = await this.$axios.get('/api/lending/trades?' + query)
            self.total = data.total
            self.pages = data.pages

            if (data.items.length === 0) {
                self.loading = false
            }
            if (self.page) {
                self.page.txsCount = self.total
            }

            data.items.forEach(async (item, index, array) => {
                if (index === array.length - 1) {
                    self.items = self.formatData(array)

                    // Hide loading.
                    self.loading = false
                }
            })

            return data
        },
        async filter () {
            await this.getDataFromApi()
        },
        async reset () {
            this.user = ''
            this.status = ''
            this.lendingToken = ''
            this.collateralToken = ''
            await this.getDataFromApi()
        },
        formatData (items = []) {
            const _items = []
            items.forEach((item) => {
                const _item = item

                if (item.timestamp) {
                    _item.timestamp = item.timestamp
                } else {
                    _item.timestamp = item.createdAt
                }
                _items.push(_item)
            })

            return _items
        },
        onChangePaginate (page) {
            this.currentPage = page
            this.getDataFromApi()
        }
    }
}
</script>
