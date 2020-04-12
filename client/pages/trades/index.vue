<template>
    <table-trade-history
        :show-filter="true"/>
</template>

<script>
import mixin from '~/plugins/mixin'
import TableTradeHistory from '~/components/TableTradeHistory'

export default {
    components: {
        TableTradeHistory
    },
    mixins: [mixin],
    head () {
        return {
            title: 'Trading history'
        }
    },
    async created () {
        this.$store.commit('breadcrumb/setItems', {
            name: 'trades',
            to: { name: 'trades' }
        })
    }
}
</script>
