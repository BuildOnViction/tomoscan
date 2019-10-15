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
            class="tomo-total-items">{{ _nFormatNumber('transaction', 'transactions', total) }}</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--transactions">
            <template
                slot="hash"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'txs-slug', params: {slug: props.item.hash}}"
                    class="text-truncate">
                    <i
                        v-if="!props.item.status"
                        class="fa fa-exclamation mr-1 text-danger tx-failed"/>
                    {{ props.item.hash }}</nuxt-link>
            </template>

            <template
                slot="block"
                slot-scope="props">
                <nuxt-link
                    v-if="props.item.blockNumber"
                    :to="{name: 'blocks-slug', params: {slug: props.item.blockNumber}}">
                    {{ props.item.blockNumber }}</nuxt-link>
                <span
                    v-else
                    class="text-muted">Pending...</span>
            </template>

            <template
                slot="timestamp"
                slot-scope="props">
                <span
                    v-b-tooltip.hover
                    :title="$moment(props.item.timestamp).format('lll')">
                    {{ $moment(props.item.timestamp).fromNow() }}</span>
            </template>

            <template
                slot="gas"
                slot-scope="props">{{ formatNumber(props.item.gas) }}</template>

            <template
                slot="from"
                slot-scope="props">
                <i
                    v-if="props.item.from_model && props.item.from_model.isContract"
                    class="tm tm-icon-contract mr-1 mr-lg-2" />
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.from}}"
                    class="text-truncate">{{ (props.item.from_model && props.item.from_model.accountName) ?
                    props.item.from_model.accountName : props.item.from }}</nuxt-link>
            </template>

            <template
                slot="arrow"
                slot-scope="props">
                <i class="tm-arrow-right text-success"/>
            </template>

            <template
                slot="to"
                slot-scope="props">
                <div v-if="props.item.to">
                    <i
                        v-if="props.item.to_model && props.item.to_model.isContract"
                        class="tm tm-icon-contract mr-1 mr-lg-2" />
                    <nuxt-link
                        :to="{name: 'address-slug', params:{slug: props.item.to}}"
                        class="text-truncate">{{ (props.item.to_model && props.item.to_model.accountName) ?
                        props.item.to_model.accountName : props.item.to }}</nuxt-link>
                </div>
                <div
                    v-else
                    class="contract-creation">
                    <span>Contract Creation</span>
                </div>
            </template>

            <template
                slot="value"
                slot-scope="props">{{ formatUnit(toTomo(props.item.value)) }}</template>

            <template
                slot="txFee"
                slot-scope="props">
                <span
                    v-b-tooltip.hover
                    :title="formatUnit(toTomo(props.item.gasPrice * props.item.gasUsed, 18))">
                    {{ formatUnit(toTomo(props.item.gasPrice * props.item.gasUsed, 8)) }}</span></template>
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
            title: 'Block ' + this.$route.params.slug + ' Info'
        }
    },
    props: {
        block: {
            type: Number,
            default: 0
        },
        page: {
            type: Object,
            default: () => {
                return {}
            }
        },
        block_timestamp: {
            type: String,
            default: ''
        },
        parent: {
            type: String,
            default: ''
        }
    },
    data: () => ({
        fields: {
            hash: { label: 'TxHash' },
            block: { label: 'Block' },
            timestamp: { label: 'Age' },
            from: { label: 'From' },
            arrow: { label: '' },
            to: { label: 'To' },
            value: { label: 'Value', cssClass: 'pr-lg-4' },
            txFee: { label: 'TxFee' }
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

        self.blockNumber = self.block

        self.getDataFromApi()
    },
    methods: {
        async getDataFromApi () {
            let self = this

            // Show loading.
            self.loading = true
            let params = {
                page: self.currentPage,
                limit: self.perPage
            }
            let query = this.serializeQuery(params)
            let { data } = await this.$axios.get('/api/txs/listByBlock/' + self.block + '?' + query)
            self.total = data.total || self.tx_total || (data.items || []).length
            self.pages = data.pages || (self.total % self.perPage)

            if (data.items.length === 0) {
                self.loading = false
            }
            if (self.page) {
                self.page.txsCount = self.total
            }

            data.items.forEach(async (item, index, array) => {
                if (index === array.length - 1) {
                    self.items = array

                    // Format data.
                    if (self.blockNumber) {
                        self.items = self.formatData(self.items, self.block_timestamp)
                    } else {
                        self.items = self.formatData(self.items, null)
                    }

                    // Hide loading.
                    self.loading = false
                }
            })

            return data
        },
        formatData (items = [], blockTimestamp) {
            let _items = []
            items.forEach((item) => {
                let _item = item

                // Format for timestamp.
                if (blockTimestamp) {
                    _item.timestamp = blockTimestamp
                } else if (!item.block) {
                    if (item.timestamp) {
                        _item.timestamp = item.timestamp
                    } else {
                        _item.timestamp = item.createdAt
                    }
                } else {
                    _item.timestamp = item.block.timestamp
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
