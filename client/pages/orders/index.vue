<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('order', 'orders', total) }}</p>
        <form
            class="form-inline mb-30 filter-box"
            method="get">
            <div class="form-group">
                <label
                    for="inputUserAddress"
                    class="mr-sm-3">Address</label>
                <input
                    id="inputUserAddress"
                    v-model="user"
                    name="user"
                    type="text"
                    class="form-control"
                    placeholder="User address">
            </div>
            <div class="form-group mx-sm-3">
                <label
                    for="inputPairName"
                    class="mr-sm-3">Pair</label>
                <input
                    id="inputPairName"
                    v-model="pair"
                    name="pair"
                    type="text"
                    class="form-control"
                    placeholder="Pair name">
            </div>
            <div class="form-group mr-sm-3">
                <label
                    for="inputSide"
                    class="mr-sm-3">Side</label>
                <select
                    id="inputSide"
                    v-model="side"
                    name="side"
                    class="form-control mx-sm-1">
                    <option
                        value=""
                        selected
                        hidden
                        disabled>Select side</option>
                    <option value="">No filter</option>
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                </select>
            </div>
            <button
                type="submit"
                class="btn btn-primary mr-sm-3">Filter</button>
            <button
                type="button"
                class="btn btn-secondary"
                @click="reset">Reset</button>
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
            class="tomo-table--orders">
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
                    :to="{name: 'orders-slug', params: {slug: props.item.hash.toLowerCase()}}">
                    {{ hiddenString(props.item.hash.toLowerCase(), 8) }}</nuxt-link>
            </template>
            <template
                slot="userAddress"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.userAddress.toLowerCase()}}">
                    {{ hiddenString(props.item.userAddress.toLowerCase(), 8) }}</nuxt-link>
            </template>
            <template
                slot="pairName"
                slot-scope="props">
                <span>
                    <nuxt-link
                        v-if="props.item.baseToken !== '0x0000000000000000000000000000000000000001'"
                        :to="{name: 'tokens-slug', params: {slug: props.item.baseToken}}">
                        {{ props.item.pairName.split('/')[0] }}</nuxt-link>
                    <span v-else>{{ props.item.pairName.split('/')[0] }}</span>/<nuxt-link
                        v-if="props.item.quoteToken !== '0x0000000000000000000000000000000000000001'"
                        :to="{name: 'tokens-slug', params: {slug: props.item.quoteToken}}"
                    >{{ props.item.pairName.split('/')[1] }}</nuxt-link>
                    <span v-else>{{ props.item.pairName.split('/')[1] }}</span>
                </span>
            </template>
            <template
                slot="quantity"
                slot-scope="props">
                {{ formatNumber(props.item.quantity) + ' ' + props.item.pairName.split('/')[0] }}
            </template>
            <template
                slot="price"
                slot-scope="props">
                {{ formatNumber(props.item.price) + ' ' + props.item.pairName.split('/')[1] }}
            </template>
            <template
                slot="filledAmount"
                slot-scope="props">
                {{ formatNumber(props.item.filledAmount) + ' ' + props.item.pairName.split('/')[0] }}
            </template>
            <template
                slot="type"
                slot-scope="props">
                {{ props.item.type === 'LO' ? 'Limit' : 'Market' }}
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
            @change="onChangePaginate"
        />
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
    head () {
        return {
            title: 'Orders'
        }
    },
    data: () => ({
        fields: {
            hash: { label: 'Hash' },
            userAddress: { label: 'User' },
            pairName: { label: 'Pair Name' },
            side: { label: 'Side' },
            quantity: { label: 'Quantity' },
            price: { label: 'Price' },
            filledAmount: { label: 'Filled Amount' },
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
        pair: '',
        side: ''
    }),
    async created () {
        if (this.$route.query.user) {
            this.user = this.$route.query.user
        }
        if (this.$route.query.pair) {
            this.pair = this.$route.query.pair
        }
        if (this.$route.query.side) {
            this.side = this.$route.query.side
        }
        this.$store.commit('breadcrumb/setItems', {
            name: 'orders',
            to: { name: 'orders' }
        })
        this.getDataFromApi()
    },
    methods: {
        async getDataFromApi () {
            let self = this

            self.loading = true
            let params = {
                page: self.currentPage,
                limit: self.perPage
            }
            if (this.user !== '') {
                params.user = this.user.trim()
            }
            if (this.pair !== '') {
                params.pair = this.pair.trim()
            }
            if (this.side !== '') {
                params.side = this.side
            }
            let query = this.serializeQuery(params)
            let { data } = await this.$axios.get('/api/orders?' + query)
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
            this.pair = ''
            this.side = ''
            await this.getDataFromApi()
        },
        formatData (items = []) {
            let _items = []
            items.forEach((item) => {
                let _item = item

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
