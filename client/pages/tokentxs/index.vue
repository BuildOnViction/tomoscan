<template>
    <section>
        <table-token-tx/>
    </section>
</template>

<script>
import TableTokenTx from '~/components/TableTokenTx'

export default {
    components: {
        TableTokenTx
    },
    head () {
        return {
            title: 'Token (TRC20) Transfers'
        }
    },
    async mounted () {
        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'tokentxs', to: { name: 'tokentxs' } })
    }
}
</script>

<style scoped>

</style>
