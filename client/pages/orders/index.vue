<template>
    <table-order :show-filter="true"/>
</template>

<script>
import mixin from '~/plugins/mixin'
import TableOrder from '~/components/TableOrder'

export default {
    components: {
        TableOrder
    },
    mixins: [mixin],
    async created () {
        this.$store.commit('breadcrumb/setItems', {
            name: 'orders',
            to: { name: 'orders' }
        })
    },
    head () {
        return {
            title: 'Orders'
        }
    }
}
</script>
