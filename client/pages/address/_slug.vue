<template>
  <div
    v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
	<section v-else>
		<div class="card tomo-card tomo-card--address">
			<div class="tomo-card__header">
				<h3	:class="'tomo-card__headline' + (address && address.isContract ? ' tomo-card__headline--is-contract' : '')">
					<span v-if="address && address.isContract">Contract:</span>
					<read-more
						class="d-sm-none"
						:text="hash" />
					<read-more
						class="d-none d-sm-inline-block d-lg-none"
						:text="hash"
						:maxChars="20" />
					<read-more
						class="d-none d-lg-inline-block d-xl-none"
						:text="hash"
						:maxChars="30" />
					<span class="d-none d-xl-inline-block">{{ hash }}</span>
				</h3>
			</div>
			<div class="tomo-card__body">
				<table class="tomo-card__table">
					<tbody>
						<tr>
							<td>TOMO Balance</td>
							<td>
								<span>{{ formatUnit(toEther(address.balance)) }}</span>
							</td>
						</tr>
						<tr>
							<td>TOMO USD Value</td>
							<td>
								<span>{{ formatNumber(usdPrice * toEtherNumber(address.balance)) }}</span>
							</td>
						</tr>
						<tr>
							<td>No Of Transactions</td>
							<td>
								<span>{{ formatNumber(address.transactionCount) }}</span> txns
							</td>
						</tr>
						<tr v-if="address && !address.isContract">
							<td>Code</td>
							<td>
								<read-more
									class="d-sm-none"
									:text="address.code" />
								<read-more
									class="d-none d-sm-inline-block d-lg-none"
									:text="address.code"
									:maxChars="20" />
								<read-more
									class="d-none d-lg-inline-block d-xl-none"
									:text="address.code"
									:maxChars="30" />
								<span class="d-none d-xl-inline-block">{{ address.code }}</span>
							</td>
						</tr>
						<tr v-if="address && address.token">
							<td>Token Contract</td>
							<td>
								<nuxt-link class="pull-right text-right" :to="{name: 'tokens-slug', params: {slug: address.token.hash}}">{{ address.token.name }}({{ address.token.symbol }})</nuxt-link>
							</td>
						</tr>
						<tr v-if="address && address.contractCreation">
							<td>Contract Creator</td>
							<td>
								<nuxt-link :to="{name: 'address-slug', params: {slug: address.contractCreation}}">{{ address.contractCreation }}</nuxt-link>
								<span>at txns&nbsp;</span>
								<span v-if="address.fromTxn">
									<nuxt-link :to="{name: 'txs-slug', params: {slug: address.fromTxn}}">{{ address.fromTxn }}</nuxt-link>
								</span>
							</td>
						</tr>
						<tr
							v-if="address && address.isContract && ! address.contract"
							class="is-contract-message">
							<td>
								<div>Are you the contract creator?
									<nuxt-link :to="{name: 'contracts-verify', query: {address: hash}}">Verify And Publish</nuxt-link>
									your contract source code Today!
								</div>
							</td>
						</tr>
					</tbody>
				</table>
				<div class="text-center text-lg-right tomo-qrcode">
					<vue-qrcode class="img-fluid" :value="currentUrl" :options="{size: 250}"></vue-qrcode>
				</div>
			</div>
		</div>

		<b-tabs class="tomo-tabs">
			<b-tab title="Transactions">
				<table-tx :address="hash"></table-tx>
			</b-tab>
			<b-tab title="Mined Blocks">
				<table-tx-by-account></table-tx-by-account>
			</b-tab>
			<b-tab
				v-if="address && address.hashTokens"
				title="Token Holding">
				<table-tokens-by-account :address="hash"></table-tokens-by-account>
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
						v-model="address.code"
						cols="30" rows="10" class="form-control"></textarea>
				</b-form-group>
			</b-tab>
			<b-tab :title="'Events (' + itemsLength + ')'">
				<table-event :address="hash" :page="this"></table-event>
			</b-tab>
		</b-tabs>
	</section>
</template>
<script>
  import mixin from '~/plugins/mixin'
  import TableTx from '~/components/TableTx'
  import TableTokensByAccount from '~/components/TableTokensByAccount'
  import TableTxByAccount from '~/components/TableTxByAccount'
  import TableEvent from '~/components/TableEvent'
  import ReadMore from '~/components/ReadMore'
  import VueQrcode from '@xkeshi/vue-qrcode'

  export default {
    mixins: [mixin],
    components: {
      TableTx,
      TableTokensByAccount,
      TableTxByAccount,
      TableEvent,
      ReadMore,
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
      loading: true
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
				
      self.loading = true

      self.getAccountFromApi()
      self.getUSDPrice()
    },
    methods: {
      async getAccountFromApi () {
				let self = this

        let {data} = await this.$axios.get('/api/accounts/' + self.hash)
        self.address = data
				self.smartContract = data.contract
				
        self.loading = false
      },
      async getUSDPrice () {
        let self = this

        self.$store.dispatch('app/getUSDPrice')
      },
    },
  }
</script>
