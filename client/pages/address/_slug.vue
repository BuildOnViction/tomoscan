<template>
	<section>
		<div class="card mb-3">
			<div class="card-body">
				<b-row>
					<b-col md="9">
						<h2 class="mb-4">{{ hash }}</h2>

						<table class="table">
							<tbody>
							<tr>
								<td>TOMO Balance:</td>
								<td>
									<span-loading v-bind:text="address ? formatUnit(toEther(address.balance)) : null"></span-loading>
								</td>
							</tr>
							<tr>
								<td>TOMO USD Value:</td>
								<td>
									$&nbsp;<span-loading v-bind:text="address ? usdPrice * toEther(address.balance) : null"></span-loading>
								</td>
							</tr>
							<tr>
								<td>No Of Transactions:</td>
								<td>
									<span-loading v-bind:text="address ? formatNumber(address.transactionCount) : null"></span-loading>&nbsp;txns
								</td>
							</tr>
							<tr>
								<td>Code:</td>
								<td>
									<code class="address__tag">
										<span-loading v-bind:text="address ? address.code : null"></span-loading>
									</code>
								</td>
							</tr>
							<tr v-if="address && address.token">
								<td>Token Contract:</td>
								<td>
									<nuxt-link class="pull-right text-right" :to="{name: 'tokens-slug', params: {slug: address.token.hash}}">{{ address.token.name }}({{ address.token.symbol }})</nuxt-link>
								</td>
							</tr>
							<tr v-if="address && address.contractCreation">
								<td>Contract Creator:</td>
								<td>
									<nuxt-link class="address__tag" :to="{name: 'address-slug', params: {slug: address.contractCreation}}">{{ address.contractCreation }}</nuxt-link>
									<span>at txns&nbsp;</span>
									<span v-if="address.fromTxn">
										<nuxt-link class="address__tag" :to="{name: 'txs-slug', params: {slug: address.fromTxn}}">{{ address.fromTxn }}</nuxt-link>
									</span>
								</td>
							</tr>
							</tbody>
						</table>
					</b-col>
					<b-col md="3" class="text-center">
						<vue-qrcode class="img-fluid" :value="currentUrl" :options="{size: 250}"></vue-qrcode>
					</b-col>
				</b-row>
			</div>
		</div>

		<div class="card mb-3" v-if="address && address.hashTokens">
			<div class="card-body">
				<h5 class="card-title">Token Balances</h5>
				<tokens-by-account-table :address="hash"></tokens-by-account-table>
			</div>
		</div>

		<b-row>
			<b-col>
				<b-card no-body>
					<b-tabs card>
						<b-tab title="Transactions">
							<tx-table :address="hash"></tx-table>
						</b-tab>
						<b-tab title="Mined Blocks">
							<tx-by-account-table></tx-by-account-table>
						</b-tab>
					</b-tabs>
				</b-card>
			</b-col>
		</b-row>
	</section>
</template>
<script>
  import mixin from '~/plugins/mixin'
  import TxTable from '~/components/TxTable'
  import TokensByAccountTable from '~/components/TokensByAccountTable'
  import TxByAccountTable from '~/components/TxByAccountTable'
  import SpanLoading from '~/components/SpanLoading'
  import VueQrcode from '@xkeshi/vue-qrcode'

  export default {
    mixins: [mixin],
    components: {
      TxTable,
      TokensByAccountTable,
      TxByAccountTable,
      SpanLoading,
      VueQrcode,
    },
    head () {
      return {
        title: 'Address ' + this.hash,
      }
    },
    computed: {
      usdPrice () {
        return this.$store.state.app.usdPrice
      },
    },
    data: () => ({
      hash: null,
      address: null,
      currentUrl: '',
    }),
    created () {
      let hash = this.$route.params.slug
      if (hash) {
        this.hash = hash
      }
    },
    mounted () {
      let self = this

      // Set current url.
      self.currentUrl = window.location.href

      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'address-slug', to: {name: 'address-slug', params: {slug: self.hash}}})

      self.getAccountFromApi()
      self.getUSDPrice()
    },
    methods: {
      async getAccountFromApi () {
        let self = this

        let {data} = await this.$axios.get('/api/accounts/' + self.hash)
        self.address = data
      },
      async getUSDPrice () {
        let self = this

        self.$store.dispatch('app/getUSDPrice')
      },
    },
  }
</script>