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
                slot="volume24h"
                slot-scope="props">{{ props.item.volume24h }} USD
            </template>
            <template
                slot="lending24h"
                slot-scope="props">{{ props.item.lending24h }} USD
            </template>
            <template
                slot="spotFee"
                slot-scope="props">{{ props.item.spotFee / 100 }} %
            </template>
            <template
                slot="lendingFee"
                slot-scope="props">{{ props.item.lendingFee / 100 }} %
            </template>
        </table-base>

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
            name: { label: 'Name' },
            owner: { label: 'Owner' },
            deposit: { label: 'Available Amount' },
            volume24h: { label: 'Volume 24h' },
            lending24h: { label: 'Lending 24h' },
            spotFee: { label: 'Trading Fee' },
            lendingFee: { label: 'Lending Fee' }
        },
        loading: true,
        total: 0,
        items: []
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
            // Show loading.
            this.loading = true

            const { data } = await this.$axios.get('/api/relayers')
            this.items = data
            this.total = data.length

            // Hide loading.
            this.loading = false

            return data
        }
    },
    head: () => ({
        title: 'Relayers'
    })
}
</script>

<style scoped>
</style>
