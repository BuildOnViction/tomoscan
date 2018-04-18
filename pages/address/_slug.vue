<template>
	<div>
		<b-card>
			<div v-if="address" class="table__overflow">
				<table class="datatable table">
					<thead>
					<tr>
						<th colspan="2">Overview</th>
					</tr>
					</thead>
					<tbody>
					<tr>
						<td>ETH Balance:</td>
						<td>{{ formatUnit(toEther(address.balance)) }}</td>
					</tr>
					<tr>
						<td>No Of Transactions:</td>
						<td>{{ address.﻿transactionCount }} txns</td>
					</tr>
					</tbody>
				</table>
			</div>
		</b-card>
		<v-tabs>
			<v-tab>Transactions</v-tab>
			<v-tab-item>
				<tx-table :address="hash"></tx-table>
			</v-tab-item>
		</v-tabs>
	</div>
</template>
<script>
	import async from 'async'
  import mixin from '~/plugins/mixin'
  import TxTable from '~/components/TxTable'

  export default {
    mixins: [mixin],
    components: {
      'tx-table': TxTable
    },
    head () {
      let address = this.$route.params.slug

      return {
        title: 'Address ' + address,
      }
    },
    data: () => ({
	    hash: null,
	    address: null
    }),
    async mounted () {
      let self = this
      let hash = self.$route.params.slug
      if (hash) {
        self.hash = hash
      }

      self.getAccountFromApi()
    },
    methods: {
      async getAccountFromApi() {
        let self = this

	      let {data} = await this.$axios.get('/api/accounts/' + self.hash)
	      self.address = data
      },
    },
  }
</script>