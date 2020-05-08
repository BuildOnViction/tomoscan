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
    async created () {
        this.$store.commit('breadcrumb/setItems', {
            name: 'trades',
            to: { name: 'trades' }
        })
    },
    head () {
        return {
            title: 'Trading history'
        }
    }
}
</script>
