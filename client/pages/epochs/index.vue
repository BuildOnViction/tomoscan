<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-cubes tomo-empty__icon"/>
            <p class="tomo-empty__description">No Epoch found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('epoch', 'epochs', total) }}</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--epochs">

            <template
                slot="epoch"
                slot-scope="props">
                <nuxt-link :to="{name: 'epochs-slug', params: {slug: props.item.epoch}}">
                    {{ props.item.epoch }}
                </nuxt-link>
            </template>
            <template
                slot="startBlock"
                slot-scope="props">
                <nuxt-link :to="{name: 'blocks-slug', params: {slug: props.item.startBlock}}">
                    {{ props.item.startBlock }}
                </nuxt-link>
            </template>
            <template
                slot="endBlock"
                slot-scope="props">
                <nuxt-link :to="{name: 'blocks-slug', params: {slug: props.item.endBlock}}">
                    {{ props.item.endBlock }}
                </nuxt-link>
            </template>
            <template
                slot="slashedNode"
                slot-scope="props">
                {{ props.item.slashedNode ? props.item.slashedNode.length : 0 }}
            </template>
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
        title: 'Epoch'
    }),
    data: () => ({
        fields: {
            epoch: { label: 'Epoch' },
            startBlock: { label: 'Start block' },
            endBlock: { label: 'End block' },
            duration: { label: 'Duration' },
            masterNodeNumber: { label: 'MasterNode' },
            voterNumber: { label: 'Voter' },
            slashedNode: { label: 'SlashedNode' }
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
            this.$store.commit('breadcrumb/setItems', { name: 'epochs', to: { name: 'epochs' } })

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
            let { data } = await this.$axios.get('/api/epochs' + '?' + query)
            self.items = data.items
            self.total = data.total
            self.lastBlock = data.lastBlock
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
