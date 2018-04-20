<template>
	<div>
		<tx-table :type="'pending'"></tx-table>
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
      this.$store.commit('breadcrumb/setItems', {name: 'txs-pending', to: {name: 'txs-pending'}})
    },
  }
</script>

<style scoped>

</style>
