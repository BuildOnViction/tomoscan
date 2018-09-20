<template>
    <table-tx/>
</template>

<script>
import TableTx from '~/components/TableTx'

export default {
    components: {
        TableTx
    },
    mounted () {
        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'other-txs', to: { name: 'other-txs' } })
    }
}
</script>

<style scoped>

</style>
