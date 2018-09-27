<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-file-text-o tomo-empty__icon"/>
            <p class="tomo-empty__description">No verified contract found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">
            Total {{ _nFormatNumber('verified contract', 'verified contracts', total) }} found
        </p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--contracts">

            <template
                slot="hash"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.hash}}"
                    class="text-truncate">{{ props.item.hash }}</nuxt-link>
            </template>

            <template
                slot="contractName"
                slot-scope="props">{{ props.item.contractName }}</template>

            <template
                slot="compiler"
                slot-scope="props">
                <span>{{ props.item.compiler }}</span>
            </template>

            <template
                slot="balance"
                slot-scope="props">
                <span>{{ formatUnit(toEther(props.item.balance)) }}</span>
            </template>

            <template
                slot="txCount"
                slot-scope="props">
                <span>{{ formatNumber(props.item.txCount) }}</span>
            </template>

            <template
                slot="createdAt"
                slot-scope="props">
                <span>{{ $moment(props.item.createdAt).format('ll') }}</span>
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
    data () {
        return {
            fields: {
                hash: { label: 'Address' },
                contractName: { label: 'ContractName' },
                compiler: { label: 'Compiler' },
                balance: { label: 'Balance' },
                txCount: { label: 'TxCount' },
                createdAt: { label: 'Date Verified' }
            },
            loading: true,
            pagination: {},
            total: 0,
            items: [],
            currentPage: 1,
            perPage: 15,
            pages: 1
        }
    },
    watch: {
        $route (to, from) {
            const hash = window.location.hash
            const page = hash.substring(1)
            this.onChangePaginate(page)
        }
    },
    mounted () {
        let self = this
        // Init breadcrumbs data.
        self.$store.commit('breadcrumb/setItems', { name: 'contracts', to: { name: 'contracts' } })

        self.getDataFromApi()
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

            if (self.address) {
                params.address = self.address
            }

            let query = this.serializeQuery(params)
            let { data } = await this.$axios.get('/api/contracts' + '?' + query)
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
            // Set page
            window.location.hash = page

            self.getDataFromApi()
        }
    }
}
</script>
