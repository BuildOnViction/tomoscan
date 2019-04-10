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
            class="tomo-total-items">{{ _nFormatNumber('block', 'blocks', total) }}</p>

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
                <span
                    v-b-tooltip.hover
                    :title="$moment(props.item.timestamp).format('lll')">
                    {{ $moment(props.item.timestamp).fromNow() }}</span>
            </template>

            <template
                slot="e_tx"
                slot-scope="props">{{ props.item.e_tx }}</template>

            <template
                slot="gasUsed"
                slot-scope="props">{{ formatNumber(props.item.gasUsed) }}</template>
        </table-base>

        <b-pagination-nav
            v-if="total > 0 && total > perPage"
            v-model="currentPage"
            :total-rows="total"
            :per-page="perPage"
            :number-of-pages="pages"
            :link-gen="linkGen"
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
        },
        parent: {
            type: String,
            default: ''
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
        currentPage: 0,
        perPage: 20,
        pages: 1
    }),
    watch: {
        $route (to, from) {
            const page = this.$route.query.page
            this.onChangePaginate(page)
        }
    },
    async mounted () {
        this.getDataFromApi()
    },
    methods: {
        async getDataFromApi () {
            let self = this

            // Show loading.
            self.loading = true

            self.currentPage = parseInt(this.$route.query.page)

            let params = {
                page: self.currentPage || 1,
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
        },
        linkGen (pageNum) {
            return {
                query: {
                    page: pageNum
                },
                hash: this.parent
            }
        }
    }
}
</script>
