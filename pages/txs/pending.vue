<template>
	<div>
		<tx-table :type="'pending'"></tx-table>
	</div>
</template>

<script>
  import TxTable from '~/components/TxTable'
  export default {
    components: {
      'tx-table': TxTable
    }
  }
</script>

<style scoped>

</style>
