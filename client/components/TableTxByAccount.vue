<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>

        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-cube tomo-empty__icon"/>
            <p class="tomo-empty__description">No item found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">Total {{ _nFormatNumber('block', 'blocks', total) }} found</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--tx-by-account">
            <template
                slot="block"
                slot-scope="props">
                <nuxt-link :to="{name: 'blocks-slug', params: {slug: props.item.number}}">
                    {{ props.item.number }}</nuxt-link>
            </template>

            <template
                slot="timestamp"
                slot-scope="props">
                <span :id="'timestamp__' + props.index">{{ $moment(props.item.timestamp).fromNow() }}</span>
                <b-tooltip :target="'timestamp__' + props.index">
                    {{ $moment(props.item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
                </b-tooltip>
            </template>

            <template
                slot="e_tx"
                slot-scope="props">{{ props.item.e_tx }}</template>

            <template
                slot="gasUsed"
                slot-scope="props">{{ formatNumber(props.item.gasUsed) }}</template>
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
        page: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    data: () => ({
        fields: {
            block: { label: 'Block' },
            timestamp: { label: 'Age' },
            e_tx: { label: 'txn' },
            gasUsed: { label: 'Gas Used' }
        },
        loading: true,
        pagination: {},
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 15,
        pages: 1
    }),
    async mounted () {
        this.getDataFromApi()
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

            let hash = this.$route.params.slug

            let query = this.serializeQuery(params)
            let { data } = await this.$axios.get('/api/accounts/' + hash + '/mined?' + query)
            self.items = data.items
            self.total = data.total
            self.currentPage = data.currentPage
            self.pages = data.pages
            self.perPage = data.perPage

            if (self.page) {
                self.page.blocksCount = self.total
            }

            // Hide loading.
            self.loading = false

            return data
        },
        onChangePaginate (page) {
            let self = this
            self.currentPage = page

            self.getDataFromApi()
        }
    }
}
</script>
