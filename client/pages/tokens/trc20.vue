<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>

        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-chain-broken tomo-empty__icon"/>
            <p class="tomo-empty__description">No token found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('token', 'tokens', total) }}</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--tokens">

            <template
                slot="hash"
                slot-scope="props">
                <nuxt-link :to="{name: 'tokens-slug', params: {slug: props.item.hash}}">
                    <span class="text-truncate">{{ props.item.hash }}</span>
                </nuxt-link>
            </template>

            <template
                slot="name"
                slot-scope="props">
                <nuxt-link :to="{name: 'tokens-slug', params: {slug: props.item.hash}}">
                    {{ trimWord(props.item.name) }}
                </nuxt-link>
            </template>

            <template
                slot="symbol"
                slot-scope="props">{{ props.item.symbol }}</template>

            <template
                slot="totalSupply"
                slot-scope="props">{{ formatNumber(props.item.totalSupplyNumber) }} {{ props.item.symbol }}</template>

            <template
                slot="decimals"
                slot-scope="props">{{ formatNumber(props.item.decimals) }}</template>
        </table-base>

        <b-pagination
            v-if="total > 0 && total > perPage"
            v-model="currentPage"
            :total-rows="pages * perPage"
            :per-page="perPage"
            :number-of-pages="pages"
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
    data: () => ({
        fields: {
            hash: { label: 'Hash' },
            name: { label: 'Name' },
            symbol: { label: 'Symbol' },
            totalSupply: { label: 'Total Supply' },
            decimals: { label: 'Decimals' }
        },
        loading: true,
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 20,
        pages: 1
    }),
    mounted () {
        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', {
            name: 'tokens-trc20',
            to: { name: 'tokens-trc20' }
        })

        this.getDataFromApi()
    },
    methods: {
        async getDataFromApi () {
            let self = this

            // Show loading.
            self.loading = true

            let params = {
                page: self.currentPage,
                limit: self.perPage,
                type: 'trc20'
            }

            let query = this.serializeQuery(params)
            let { data } = await this.$axios.get('/api/tokens' + '?' + query)
            self.items = data.items
            self.total = data.total
            self.pages = data.pages

            // Hide loading.
            self.loading = false

            return data
        },
        onChangePaginate (page) {
            this.currentPage = page
            this.getDataFromApi()
        }
    }
}
</script>
