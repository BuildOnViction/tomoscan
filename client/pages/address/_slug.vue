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
							<tr v-if="address && !address.isContract">
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

						<p v-if="address && address.isContract && ! address.contract">Are you The Contract Creator?
							<nuxt-link :to="{name: 'contracts-verify', query: {address: hash}}">Verify And Publish</nuxt-link>
							your Contract Source Code Today!
						</p>
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
				<table-tokens-by-account :address="hash"></table-tokens-by-account>
			</div>
		</div>

		<b-row>
			<b-col>
				<b-card no-body>
					<b-tabs card>
						<b-tab title="Transactions">
							<table-tx :address="hash"></table-tx>
						</b-tab>
						<b-tab title="Mined Blocks">
							<table-tx-by-account></table-tx-by-account>
						</b-tab>
						<b-tab v-if="address && address.isContract" title="Code">
							<section v-if="smartContract">
								<h5 class="mb-3"><i class="fa fa-check-circle-o text-success mr-1"></i>Contract Source Code Verified</h5>
								<b-row class="mb-3">
									<b-col md="6">
										<b-table class="tm__table"
										         :items="[
											{key: 'Contract Name', value: smartContract.contractName},
											{key: 'Compiler Version', value: smartContract.compiler},
										]"
										         thead-class="d-none"></b-table>
									</b-col>

									<b-col md="6">
										<b-table class="tm__table"
										         :items="[
											{key: 'Verified At', value: smartContract.updatedAt},
											{key: 'Optimization Enabled:', value: smartContract.optimization},
										]"
										         thead-class="d-none"></b-table>
									</b-col>
								</b-row>

								<b-form-group>
									<label>Contract Source Code<i class="fa fa-code ml-1"></i></label>
									<pre v-highlightjs="smartContract.sourceCode" class="hljs__code">
										<code class="javascript"></code>
									</pre>
								</b-form-group>

								<b-form-group>
									<label>Contract ABI<i class="fa fa-cogs ml-1"></i></label>
									<code class="hljs__code" v-highlightjs="smartContract.abiCode">
										<code class="json"></code>
									</code>
								</b-form-group>
							</section>

							<b-form-group label="Smart Contract Code">
								<textarea
									disabled
									cols="30" rows="10" class="form-control">{{ address.code }}</textarea>
							</b-form-group>
						</b-tab>
						<b-tab :title="'Events (' + itemsLength + ')'">
							<table-event :address="hash" :page="this"></table-event>
						</b-tab>
					</b-tabs>
				</b-card>
			</b-col>
		</b-row>
	</section>
</template>
<script>
  import mixin from '~/plugins/mixin'
  import TableTx from '~/components/TableTx'
  import TableTokensByAccount from '~/components/TableTokensByAccount'
  import TableTxByAccount from '~/components/TableTxByAccount'
  import TableEvent from '~/components/TableEvent'
  import SpanLoading from '~/components/SpanLoading'
  import VueQrcode from '@xkeshi/vue-qrcode'

  export default {
    mixins: [mixin],
    components: {
      TableTx,
      TableTokensByAccount,
      TableTxByAccount,
      TableEvent,
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
      smartContract: null,
      itemsLength: 0,
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
        self.smartContract = data.contract
      },
      async getUSDPrice () {
        let self = this

        self.$store.dispatch('app/getUSDPrice')
      },
    },
  }
</script>