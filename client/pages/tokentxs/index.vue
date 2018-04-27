<template>
	<section>
		<token-tx-table></token-tx-table>
	</section>
</template>

<script>
  import TokenTxTable from '~/components/TokenTxTable'

  export default {
    components: {
      TokenTxTable,
    },
    head () {
      return {
        title: 'Token (ERC20) Transfers',
      }
    },
    async mounted () {
      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'tokentxs', to: {name: 'tokentxs'}})

      let self = this
    },
  }
</script>

<style scoped>

</style>
