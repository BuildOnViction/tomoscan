<template>
    <section>
        <table-token-tx-nft/>
    </section>
</template>

<script>
import TableTokenTxNft from '~/components/TableTokenTxNft'

export default {
    components: {
        TableTokenTxNft
    },
    head () {
        return {
            title: 'Token TRC721 Transfers'
        }
    },
    async mounted () {
        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'tokentxs-nft', to: { name: 'tokentxs-nft' } })
    }
}
</script>

<style scoped>

</style>
