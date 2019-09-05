<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-cubes tomo-empty__icon"/>
            <p class="tomo-empty__description">No block found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('block', 'blocks', total) }}</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--blocks">

            <template
                slot="number"
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
                slot-scope="props">
                <nuxt-link :to="`/txs?block=${props.item.number}`">{{ formatNumber(props.item.e_tx) }}</nuxt-link>
            </template>

            <template
                slot="miner"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.signer}}"
                    class="text-truncate">{{ props.item.signer }}</nuxt-link>
            </template>

            <template
                slot="gasUsed"
                slot-scope="props">{{ formatNumber(props.item.gasUsed) }}</template>

            <template
                slot="finality"
                slot-scope="props">{{ formatNumber(props.item.finality) }} %</template>
        </table-base>

        <b-pagination-nav
            v-if="total > 0 && total > perPage"
            v-model="currentPage"
            :per-page="perPage"
            :number-of-pages="pages"
            :link-gen="linkGen"
            :limit="7"
            align="center"
            class="tomo-pagination"
        />
    </section>
</template>

<script>
import mixin from '~/plugins/mixin'
import TableBase from '~/components/TableBase'
import ReadMore from '~/components/ReadMore'

export default {
    components: {
        TableBase,
        ReadMore
    },
    mixins: [mixin],
    head: () => ({
        title: 'Blocks'
    }),
    data: () => ({
        fields: {
            number: { label: 'Height' },
            timestamp: { label: 'Age' },
            e_tx: { label: 'txn' },
            miner: { label: 'Creator' },
            gasUsed: { label: 'GasUsed' },
            finality: { label: 'Finality' }
        },
        loading: true,
        total: 0,
        lastBlock: 0,
        items: [],
        currentPage: 1,
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
        try {
            // Init breadcrumbs data.
            this.$store.commit('breadcrumb/setItems', { name: 'blocks', to: { name: 'blocks' } })

            const query = this.$route.query

            this.currentPage = parseInt(query.page)

            await this.getDataFromApi()
        } catch (error) {
            console.log(error)
        }
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

            let query = this.serializeQuery(params)
            let { data } = await this.$axios.get('/api/blocks' + '?' + query)
            self.items = data.items
            self.total = data.total
            self.lastBlock = data.items[0].number
            self.currentPage = data.currentPage
            self.pages = data.pages

            // Hide loading.
            this.loading = false

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
                }
            }
        }
    }
}
</script>
