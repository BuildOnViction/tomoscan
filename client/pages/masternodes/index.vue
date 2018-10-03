<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-user-secret tomo-empty__icon"/>
            <p class="tomo-empty__description">No masternode found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">Total {{ _nFormatNumber('masternode', 'masternodes', total) }} found</p>

        <b-table
            v-if="total > 0"
            :items="items"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
            :show-empty="true"
            empty-text="There are no masternodes to show"
            class="tomo-table"
            stacked="md">

            <template
                slot="address"
                slot-scope="props">
                <div>
                    <nuxt-link
                        :to="{name: 'address-slug', params: {slug: props.item.address}}"
                        class="text-truncate">{{ props.item.address }}</nuxt-link>
                </div>
            </template>

            <template
                slot="latestSignedBlock"
                slot-scope="props">
                <nuxt-link :to="{name: 'blocks-slug', params: {slug: props.item.latestSignedBlock}}">
                    {{ props.item.latestSignedBlock }}</nuxt-link>
            </template>

            <template
                slot="owner"
                slot-scope="props">
                <div>
                    <nuxt-link
                        :to="{name: 'address-slug', params: {slug: props.item.owner}}"
                        class="text-truncate">{{ props.item.owner }}</nuxt-link>
                </div>
            </template>
        </b-table>

        <b-pagination-nav
            v-if="total > 0 && total > perPage"
            :per-page="perPage"
            :number-of-pages="pages"
            :link-gen="linkGen"
            :limit="7"
            :value="currentPage"
            align="center"
            class="tomo-pagination"
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
        title: 'Masternodes'
    }),
    data: () => ({
        fields: [
            {
                key: 'address',
                label: 'Address'
            },
            {
                key: 'name',
                label: 'Name'
            },
            {
                key: 'owner',
                label: 'Owner'
            },
            {
                key: 'status',
                label: 'Status'
            },
            {
                key: 'latestSignedBlock',
                label: 'Latest signed block'
            }
        ],
        loading: true,
        pagination: {},
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 10,
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
        this.$store.commit('breadcrumb/setItems', { name: 'masternodes', to: { name: 'masternodes' } })

        const query = this.$route.query
        if (query.page && !isNaN(query.page)) {
            self.currentPage = parseInt(query.page)
        }

        await self.getDataFromApi()
    },
    methods: {
        async getDataFromApi () {
            const self = this

            // Show loading.
            self.loading = true

            let { data } = await this.$axios.get('/api/masternodes')

            for (let i = 0; i < data.length; i++) {
                if (data[i].isMasternode) {
                    self.items.push({
                        address: data[i].candidate,
                        status: 'MASTERNODE', // isMasternode = true
                        name: data[i].name || 'Anonymous',
                        owner: data[i].owner,
                        latestSignedBlock: data[i].latestSignedBlock
                    })
                }
            }
            self.total = self.items.length
            self.pages = Math.ceil(data.length / self.perPage)

            // Hide loading.
            self.loading = false

            return data
        },
        linkGen (pageNum) {
            return {
                query: {
                    page: pageNum
                },
                hash: this.parent
            }
        },
        onChangePaginate (page) {
            let self = this
            self.currentPage = page
        }
    }
}
</script>
