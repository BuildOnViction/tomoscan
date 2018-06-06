<template>
	<section>
		<b-row class="mb-4">
			<b-col>
				<h2>ERC20-TOKEN</h2>
				<p class="lead" v-html="tokenName"></p>
			</b-col>
		</b-row>

		<div class="card mb-5">
			<div class="card-body">
				<b-row v-if="token">
					<b-col>
						<table class="tm__no_border table">
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
								<td class="text-right">{{ formatUnit(formatNumber(token.totalSupply), symbol) }}</td>
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
						<table class="tm__no_border table">
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
			</div>
		</div>

		<b-row>
			<b-col>
				<b-tabs>
					<b-tab title="Token Transfers">
						<table-token-tx :token="hash"></table-token-tx>
					</b-tab>
					<b-tab title="Token Holders">
						<table-token-holder :address="hash"></table-token-holder>
					</b-tab>
				</b-tabs>
			</b-col>
		</b-row>
	</section>
</template>
<script>
  import mixin from '~/plugins/mixin'
  import TableTokenTx from '~/components/TableTokenTx'
  import TableTokenHolder from '~/components/TableTokenHolder'

  export default {
    mixins: [mixin],
    components: {
      TableTokenTx,
      TableTokenHolder,
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