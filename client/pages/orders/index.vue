<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>

        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-exchange tomo-empty__icon"/>
            <p class="tomo-empty__description">No order found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('order', 'orders', total) }}</p>
        <div class="form-inline mb-30">
            <div class="form-group">
                <label
                    class="filter-col"
                    for="pref-user">User:</label>
                <input
                    id="pref-user"
                    type="text"
                    class="form-control input-sm">
            </div> <!-- form group [rows] -->
            <div class="form-group">
                <label
                    class="filter-col"
                    style="margin-right:0;"
                    for="pref-search">Search:</label>
                <input
                    id="pref-search"
                    type="text"
                    class="form-control input-sm">
            </div><!-- form group [search] -->
            <div class="form-group">
                <label
                    class="filter-col"
                    for="pref-orderby">Type:</label>
                <select
                    id="pref-orderby"
                    class="form-control">
                    <option>Limit</option>
                    <option>Market</option>
                </select>
            </div> <!-- form group [order by] -->
            <div class="form-group">
                <button
                    type="button"
                    class="btn btn-default filter-col btn-primary">Filter
                </button>
                <button
                    type="button"
                    class="btn btn-default filter-col btn-outline-primary">Reset
                </button>
            </div>
        </div>
        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--orders">
            <template
                slot="userAddress"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.userAddress.toLowerCase()}}"
                    class="text-truncate">{{ props.item.userAddress.toLowerCase() }}</nuxt-link>
            </template>
            <template
                slot="pairName"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'token-slug', params: {slug: props.item.baseToken}}">
                {{ props.item.pairName.split('/')[0] }}</nuxt-link>/<nuxt-link
                    :to="{name: 'token-slug', params: {slug: props.item.quoteToken}}"
                >{{ props.item.pairName.split('/')[1] }}</nuxt-link>
            </template>
            <template
                slot="type"
                slot-scope="props">
                {{ props.item.type === 'LO' ? 'Limit' : 'Market' }}
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
            userAddress: { label: 'User' },
            pairName: { label: 'Pair Name' },
            side: { label: 'Side' },
            type: { label: 'Type' },
            quantity: { label: 'Quantity' },
            price: { label: 'Price' },
            filledAmount: { label: 'Filled Amount' }
        },
        loading: true,
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 20,
        pages: 1,
        blockNumber: null
    }),
    async mounted () {
        let self = this
        this.$store.commit('breadcrumb/setItems', {
            name: 'orders',
            to: { name: 'orders' }
        })
        self.getDataFromApi()
    },
    methods: {
        async getDataFromApi () {
            let self = this

            self.loading = true
            let params = {
                page: self.currentPage,
                limit: self.perPage
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
