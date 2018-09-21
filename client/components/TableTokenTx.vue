<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>

        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-exchange tomo-empty__icon"/>
            <p class="tomo-empty__description">No transaction found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">Total {{ _nFormatNumber('transaction', 'transactions', total) }}  found</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--token-tx">
            <template
                slot="transactionHash"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'txs-slug', params: {slug: props.item.transactionHash}}"
                    class="text-truncate">{{ props.item.transactionHash }}</nuxt-link>
            </template>

            <template
                slot="block"
                slot-scope="props">
                <nuxt-link
                    v-if="props.item.block"
                    :to="{name: 'blocks-slug', params: {slug: props.item.blockNumber}}">
                    {{ props.item.blockNumber }}</nuxt-link>
                <span
                    v-else
                    class="text-muted">Pending...</span>
            </template>

            <template
                slot="timestamp"
                slot-scope="props">
                <div v-if="props.item.timestamp">
                    <span :id="'age__' + props.index">{{ $moment(props.item.timestamp).fromNow() }}</span>
                    <b-tooltip :target="'age__' + props.index">
                        {{ $moment(props.item.timestamp).format('lll') }}
                    </b-tooltip>
                </div>
            </template>

            <template
                slot="from"
                slot-scope="props">
                <i
                    v-if="props.item.from_model && props.item.from_model.isContract"
                    class="tm tm-icon-contract mr-1 mr-lg-2"/>
                <span
                    v-if="address == props.item.from"
                    class="text-truncate">{{ props.item.from }}</span>
                <nuxt-link
                    v-else
                    :to="{name: 'address-slug', params: {slug: props.item.from}}"
                    class="text-truncate">{{ props.item.from }}</nuxt-link>
            </template>

            <template
                slot="arrow"
                slot-scope="props">
                <i
                    :class="props.item.from == address ? 'text-danger' : 'text-success'"
                    class="tm-arrow-right"/>
            </template>

            <template
                slot="to"
                slot-scope="props">
                <div>
                    <i
                        v-if="props.item.to_model && props.item.to_model.isContract"
                        class="tm tm-icon-contract mr-1 mr-lg-2"/>
                    <span
                        v-if="address == props.item.to"
                        class="text-truncate">{{ props.item.to }}</span>
                    <nuxt-link
                        v-else
                        :to="{name: 'address-slug', params:{slug: props.item.to}}"
                        class="text-truncate">{{ props.item.to }}</nuxt-link>
                </div>
            </template>

            <template
                slot="value"
                slot-scope="props">{{ formatUnit(toEther(props.item.value), props.item.symbol) }}</template>

            <template
                slot="token"
                slot-scope="props">
                <span v-if="props.item.symbol">ERC20 ({{ props.item.symbol }})</span>
                <i v-else>ERC20</i>
            </template>
        </table-base>

        <b-pagination
            v-if="total > 0 && total > perPage"
            v-model="currentPage"
            :total-rows="total"
            :per-page="perPage"
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
    props: {
        token: {
            type: String,
            default: ''
        },
        holder: {
            type: String,
            default: ''
        },
        page: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    data: () => ({
        fields: {
            transactionHash: { label: 'TxHash' },
            timestamp: { label: 'LastSeen' },
            from: { label: 'From' },
            arrow: { class: 'text-center' },
            to: { label: 'To' },
            value: { label: 'Value' },
            token: { label: 'Token' }
        },
        loading: true,
        pagination: {},
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 15,
        pages: 1,
        address: null
    }),
    watch: {
        $route (to, from) {
            const hash = window.location.hash
            const page = hash.substring(1)
            this.onChangePaginate(page)
        }
    },
    async mounted () {
        let self = this
        // Init from router.
        let query = self.$route.query

        if (query.address) {
            self.address = query.address
        }

        this.getDataFromApi()
    },
    methods: {
        async getDataFromApi () {
            let self = this

            // Show loading.
            self.loading = true

            let params = {
                page: self.currentPage || 1,
                limit: self.perPage
            }

            if (self.token) {
                params.token = self.token
            }
            if (self.address) {
                params.address = self.address
            }
            if (self.holder) {
                params.address = self.holder
            }

            let query = this.serializeQuery(params)
            let { data } = await this.$axios.get('/api/token-txs' + '?' + query)
            self.items = data.items
            self.total = data.total
            self.currentPage = data.currentPage
            self.pages = data.pages

            if (self.page) {
                self.page.tokenTxsCount = self.total
            }

            // Hide loading.
            self.loading = false

            // Format data.
            self.items = self.formatData(self.items)

            return data
        },
        formatData (items = []) {
            let _items = []
            items.forEach((item) => {
                let _item = item

                // Format for timestamp.
                if (!item.block) {
                    _item.timestamp = item.createdAt
                } else {
                    _item.timestamp = item.block.timestamp
                }

                _items.push(_item)
            })

            return _items
        },
        onChangePaginate (page) {
            let self = this
            self.currentPage = page
            // Set page
            window.location.hash = page

            self.getDataFromApi()
        }
    }
}
</script>
