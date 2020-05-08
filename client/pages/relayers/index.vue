<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-user-secret tomo-empty__icon"/>
            <p class="tomo-empty__description">No relayer found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('relayer', 'relayers', total) }}</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--relayers">

            <template
                slot="domain"
                slot-scope="props"><a :href="'//' + props.item.domain">{{ props.item.domain }}</a>
            </template>
            <template
                slot="address"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.address.toLowerCase()}}">
                    {{ hiddenString(props.item.address.toLowerCase(), 8) }}</nuxt-link>
            </template>
            <template
                slot="owner"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.owner.toLowerCase()}}">
                    {{ hiddenString(props.item.owner.toLowerCase(), 8) }}</nuxt-link>
            </template>

            <template
                slot="deposit"
                slot-scope="props">
                <span class="d-lg-none">{{ formatUnit(toTomo(props.item.deposit, 5)) }}</span>
                <span class="d-none d-lg-block">{{ formatUnit(toTomo(props.item.deposit)) }}</span>
            </template>
            <template
                slot="makeFee"
                slot-scope="props">{{ props.item.makeFee / 100 }} %
            </template>
            <template
                slot="takeFee"
                slot-scope="props">{{ props.item.takeFee / 100 }} %
            </template>
            <template
                slot="lendingFee"
                slot-scope="props">{{ props.item.lendingFee / 100 }} %
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
            @change="onChangePaginate"/>
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
            address: { label: 'Address' },
            domain: { label: 'Domain' },
            owner: { label: 'Owner' },
            deposit: { label: 'Available Amount' },
            makeFee: { label: 'Make Fee' },
            takeFee: { label: 'Take Fee' },
            lendingFee: { label: 'Lending Fee' }
        },
        loading: true,
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 20,
        pages: 1
    }),
    async mounted () {
        try {
            const self = this

            // Init breadcrumbs data.
            this.$store.commit('breadcrumb/setItems', { name: 'accounts', to: { name: 'accounts' } })

            await self.getDataFromApi()
        } catch (error) {
            console.log(error)
        }
    },
    methods: {
        async getDataFromApi () {
            const self = this

            // Show loading.
            self.loading = true

            const params = {
                page: self.currentPage || 1,
                limit: self.perPage
            }

            const query = this.serializeQuery(params)
            const { data } = await this.$axios.get('/api/relayers' + '?' + query)
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
    },
    head: () => ({
        title: 'Relayers'
    })
}
</script>

<style scoped>
</style>
