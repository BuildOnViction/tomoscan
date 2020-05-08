<template>
    <table-lending-topup
        :show-filter="true"/>
</template>

<script>
import mixin from '~/plugins/mixin'
import TableLendingTopup from '~/components/TableLendingTopup'

export default {
    components: {
        TableLendingTopup
    },
    mixins: [mixin],
    async created () {
        this.$store.commit('breadcrumb/setItems', {
            name: 'lending-topup',
            to: { name: 'lending-topup' }
        })
    },
    head () {
        return {
            title: 'Lending Topup'
        }
    }
}
</script>
