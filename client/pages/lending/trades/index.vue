<template>
    <table-lending-trade
        :show-filter="true"/>
</template>

<script>
import mixin from '~/plugins/mixin'
import TableLendingTrade from '~/components/TableLendingTrade'

export default {
    components: {
        TableLendingTrade
    },
    mixins: [mixin],
    head () {
        return {
            title: 'Lending Trades'
        }
    },
    async created () {
        this.$store.commit('breadcrumb/setItems', {
            name: 'lending-trades',
            to: { name: 'lending-trades' }
        })
    }
}
</script>
