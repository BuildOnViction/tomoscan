<template>
    <section>
        <table-token-tx-src21/>
    </section>
</template>

<script>
import TableTokenTxSrc21 from '~/components/TableTokenTxSrc21'

export default {
    components: {
        TableTokenTxSrc21
    },
    async mounted () {
        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'tokentxs-src21', to: { name: 'tokentxs-src21' } })
    },
    head () {
        return {
            title: 'Token SRC21 Transfers'
        }
    }
}
</script>

<style scoped>

</style>
