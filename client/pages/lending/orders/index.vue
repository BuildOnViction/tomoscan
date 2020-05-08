<template>
    <table-lending-order
        :show-filter="true"/>
</template>

<script>
import mixin from '~/plugins/mixin'
import TableLendingOrder from '~/components/TableLendingOrder'

export default {
    components: {
        TableLendingOrder
    },
    mixins: [mixin],
    async created () {
        this.$store.commit('breadcrumb/setItems', {
            name: 'lending-orders',
            to: { name: 'lending-orders' }
        })
    },
    head () {
        return {
            title: 'Lending Orders'
        }
    }
}
</script>
