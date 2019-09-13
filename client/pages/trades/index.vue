<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>

        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('trade history', 'trades history', total) }}</p>
        <form class="form-inline mb-30 filter-box">
            <div class="form-group">
                <label
                    for="inputUserAddress"
                    class="mr-sm-3">Address</label>
                <input
                    id="inputUserAddress"
                    v-model="user"
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
                    type="text"
                    class="form-control"
                    placeholder="Pair name">
            </div>
            <button
                type="button"
                class="btn btn-primary mr-sm-3"
                @click="filter">Filter</button>
            <button
                type="button"
                class="btn btn-secondary"
                @click="reset">Reset</button>
        </form>

        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-exchange tomo-empty__icon"/>
            <p class="tomo-empty__description">No order found</p>
        </div>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--trades">
            <template
                slot="txHash"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'tx-slug', params: {slug: props.item.txHash.toLowerCase()}}"
                    class="text-truncate">{{ props.item.txHash.toLowerCase() }}</nuxt-link>
            </template>
            <template
                slot="taker"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.taker.toLowerCase()}}"
                    class="text-truncate">{{ props.item.taker.toLowerCase() }}</nuxt-link>
            </template>
            <template
                slot="maker"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.maker.toLowerCase()}}"
                    class="text-truncate">{{ props.item.maker.toLowerCase() }}</nuxt-link>
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
            title: 'Trading history'
        }
    },
    data: () => ({
        fields: {
            txHash: { label: 'Tx' },
            taker: { label: 'Taker' },
            maker: { label: 'Maker' },
            pairName: { label: 'Pair Name' },
            status: { label: 'Status' },
            pricepoint: { label: 'Price point' },
            amount: { label: 'Amount' }
        },
        loading: true,
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 20,
        pages: 1,
        blockNumber: null,
        user: '',
        pair: ''
    }),
    async mounted () {
        let self = this
        this.$store.commit('breadcrumb/setItems', {
            name: 'trades',
            to: { name: 'trades' }
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
            if (this.user !== '') {
                params.user = this.user
            }
            if (this.pair !== '') {
                params.pair = this.pair
            }
            let query = this.serializeQuery(params)
            let { data } = await this.$axios.get('/api/trades?' + query)
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
            this.type = ''
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
