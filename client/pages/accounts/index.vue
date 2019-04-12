<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-user-secret tomo-empty__icon"/>
            <p class="tomo-empty__description">No account found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('account', 'accounts', total) }}</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--accounts">

            <template
                slot="rank"
                slot-scope="props">{{ props.item.rank }}</template>

            <template
                slot="hash"
                slot-scope="props">
                <div>
                    <i
                        v-if="props.item.isContract"
                        class="tm tm-icon-contract mr-1 mr-lg-2" />
                    <nuxt-link
                        :to="{name: 'address-slug', params: {slug: props.item.hash}}"
                        class="text-truncate">{{ props.item.hash }}</nuxt-link>
                </div>
            </template>

            <template
                slot="balance"
                slot-scope="props">
                <span class="d-lg-none">{{ formatUnit(toTomo(props.item.balance, 5)) }}</span>
                <span class="d-none d-lg-block">{{ formatUnit(toTomo(props.item.balance)) }}</span>
            </template>
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
    head: () => ({
        title: 'Accounts'
    }),
    data: () => ({
        fields: {
            rank: { label: 'Rank' },
            hash: { label: 'Address' },
            balance: { label: 'Balance' }
        },
        loading: true,
        pagination: {},
        total: 0,
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
        let self = this

        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'accounts', to: { name: 'accounts' } })

        const query = this.$route.query

        self.currentPage = parseInt(query.page)

        await self.getDataFromApi()
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
            let { data } = await this.$axios.get('/api/accounts' + '?' + query)
            self.items = data.items
            self.total = data.total
            self.currentPage = data.currentPage
            self.pages = data.pages

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
                }
            }
        }
    }
}
</script>

<style scoped>
</style>
