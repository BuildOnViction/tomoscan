<template>
    <table-lending-recall
        :show-filter="true"/>
</template>

<script>
import mixin from '~/plugins/mixin'
import TableLendingRecall from '~/components/TableLendingRecall'

export default {
    components: {
        TableLendingRecall
    },
    mixins: [mixin],
    async created () {
        this.$store.commit('breadcrumb/setItems', {
            name: 'lending-recalls',
            to: { name: 'lending-recalls' }
        })
    },
    head () {
        return {
            title: 'Lending Recalls'
        }
    }
}
</script>
