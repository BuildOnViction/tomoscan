<template>
	<section>
		<table-token-tx></table-token-tx>
	</section>
</template>

<script>
  import TableTokenTx from '~/components/TableTokenTx'

  export default {
    components: {
      TableTokenTx,
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
