<template>
	<div>
		<tx-table></tx-table>
	</div>
</template>

<script>
  import TxTable from '~/components/TxTable'

  export default {
    components: {
      'tx-table': TxTable,
    },
    mounted () {
      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'txs', to: {name: 'txs'}})
    },
  }
</script>

<style scoped>

</style>
