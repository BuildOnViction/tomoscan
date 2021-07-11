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
    async mounted () {
        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'tokentxs-nft', to: { name: 'tokentxs-nft' } })
    },
    head () {
        return {
            title: 'Token SRC721 Transfers'
        }
    }
}
</script>

<style scoped>

</style>
