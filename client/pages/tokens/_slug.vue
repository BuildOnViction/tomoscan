<template>
	<section>
		<b-row>
			<b-col>
				<h2>ERC20-TOKEN</h2>
				<p class="lead" v-html="tokenName"></p>
			</b-col>
		</b-row>
		<b-row v-if="token">
			<b-col>
				<table class="datatable table">
					<thead>
					<tr>
						<th colspan="2">TokenTracker Summary</th>
					</tr>
					</thead>
					<tbody>
					<tr>
						<td>
							Total Supply:
						</td>
						<td class="text-right">{{ formatUnit(toEther(token.totalSupply), symbol) }}</td>
					</tr>
					<tr>
						<td>
							No Of Transfers:
						</td>
						<td class="text-right">{{ formatNumber(token.tokenTxsCount) }}</td>
					</tr>
					</tbody>
				</table>
			</b-col>
			<b-col>
				<table class="datatable table">
					<thead>
					<tr>
						<th colspan="2" class="text-right">Reputation</th>
					</tr>
					</thead>
					<tbody>
					<tr>
						<td>
							ERC20 Contract:
						</td>
						<td>
							<nuxt-link :to="{name: 'address-slug', params: {slug: token.hash}}">{{ token.hash }}</nuxt-link>
						</td>
					</tr>
					<tr>
						<td>Decimal:</td>
						<td>{{ token.decimals }}</td>
					</tr>
					</tbody>
				</table>
			</b-col>
		</b-row>

		<b-row>
			<b-col>
				<b-card no-body>
					<b-tabs card>
						<b-tab title="Token Transfers">
							<token-tx-table :token="hash"></token-tx-table>
						</b-tab>
						<b-tab title="Token Holders">
							<token-holder-table :address="hash"></token-holder-table>
						</b-tab>
					</b-tabs>
				</b-card>
			</b-col>
		</b-row>
	</section>
</template>
<script>
  import mixin from '~/plugins/mixin'
  import TokenTxTable from '~/components/TokenTxTable'
  import TokenHolderTable from '~/components/TokenHolderTable'

  export default {
    mixins: [mixin],
    components: {
      TokenTxTable,
      TokenHolderTable,
    },
    head () {
      return {
        title: 'Token ' + this.$route.params.slug + ' Info',
      }
    },
    data () {
      return {
        hash: null,
        token: null,
        tokenName: null,
        symbol: null,
      }
    },
    created () {
      this.hash = this.$route.params.slug
    },
    async mounted () {
      let self = this

      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'tokens-slug', to: {name: 'tokens-slug', params: {slug: self.hash}}})

      let {data} = await self.$axios.get('/api/tokens/' + self.hash)
      self.token = data
      self.tokenName = data.name
      self.symbol = data.symbol
    },
  }
</script>