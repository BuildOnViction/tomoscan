<template>
    <div>
        <table-tx :type="'pending'"/>
    </div>
</template>

<script>
import TableTx from '~/components/TableTx'

export default {
    components: {
        TableTx
    },
    mounted () {
        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'txs-pending', to: { name: 'txs-pending' } })
    }
}
</script>

<style scoped>

</style>
