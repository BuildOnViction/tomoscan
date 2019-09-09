<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>

        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-user-secret tomo-empty__icon"/>
            <p class="tomo-empty__description">No holder found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('holder', 'holders', total) }}</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--holders">
            <template
                slot="hash"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'tokens-slug-trc21-holder', params: { slug: address, holder: props.item.hash}}"
                    class="text-truncate">{{ props.item.hash }}</nuxt-link>
            </template>

            <template
                slot="quantity"
                slot-scope="props">
                {{ formatUnit(toTokenQuantity(props.item.quantity, props.item.tokenObj.decimals),
                              props.item.tokenObj.symbol) }}
            </template>
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
    props: {
        address: {
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
            rank: { label: 'Rank' },
            hash: { label: 'Address' },
            quantity: { label: 'Quantity' },
            percentage: { label: 'Percentage' }
        },
        loading: true,
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

            if (self.address) {
                params.address = self.address
            }

            let query = this.serializeQuery(params)
            let { data } = await this.$axios.get('/api/token-holders/trc21' + '?' + query)
            self.items = data.items
            self.total = data.total
            self.pages = data.pages

            if (self.page) {
                self.page.holdersCount = self.total
            }

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
