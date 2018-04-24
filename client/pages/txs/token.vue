<template>
	<div>
		<tx-table :type="'token'"></tx-table>
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
      this.$store.commit('breadcrumb/setItems', {name: 'txs-token', to: {name: 'txs-token'}})
    },
  }
</script>

<style scoped>

</style>
