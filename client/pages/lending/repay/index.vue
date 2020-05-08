<template>
    <table-lending-repay
        :show-filter="true"/>
</template>

<script>
import mixin from '~/plugins/mixin'
import TableLendingRepay from '~/components/TableLendingRepay'

export default {
    components: {
        TableLendingRepay
    },
    mixins: [mixin],
    async created () {
        this.$store.commit('breadcrumb/setItems', {
            name: 'lending-repay',
            to: { name: 'lending-repay' }
        })
    },
    head () {
        return {
            title: 'Lending Repay'
        }
    }
}
</script>
