<template>
	<div
    v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
	<section v-else>
		<h3 class="">TXID:
			<read-more :text="hash" />
		</h3>

		<b-row>
			<b-col>
				<b-tabs class="tomo-tabs">
					<b-tab title="Overview">
						<div class="card tomo-card tomo-card--transaction">
							<div class="tomo-card__body">
								<table v-if="tx" class="tomo-card__table">
									<tbody>
									<tr>
										<td>TxHash</td>
										<td>
											<read-more
												class="d-sm-none"
												:text="tx.hash" />
											<read-more
												class="d-none d-sm-block d-md-none"
												:text="tx.hash"
												:maxChars="20"/>
											<read-more
												class="d-none d-md-block d-lg-none"
												:text="tx.hash"
												:maxChars="40"/>
											<span class="d-none d-lg-block">{{ tx.hash }}</span>
										</td>
									</tr>
									<tr>
										<td>TxReceipt Status</td>
										<td>{{ tx.status ? 'Success' : 'Reject' }}</td>
									</tr>
									<tr>
										<td>Block</td>
										<td>
											<nuxt-link
												v-if="tx.blockNumber"
												class="mr-1"
												:to="{name: 'blocks-slug', params: {slug:tx.blockNumber}}">{{ tx.blockNumber }}</nuxt-link>
											<span
												v-else
												class="text-muted mr-1">Pending...</span>
											<span>({{ tx.latestBlockNumber - tx.blockNumber }} block confirmation)</span>
										</td>
									</tr>
									<tr>
										<td>Time Stamp</td>
										<td v-html="tx.timestamp_moment"></td>
									</tr>
									<tr>
										<td>From</td>
										<td>
											<i v-if="tx.from_model && tx.from_model.isContract" class="tm tm-icon-contract mr-1"></i>
											<nuxt-link :to="{name: 'address-slug', params: {slug: tx.from}}">
												<read-more
													class="d-sm-none"
													:text="tx.from" />
												<read-more
													class="d-none d-sm-block d-md-none"
													:text="tx.from"
													:maxChars="20"/>
												<read-more
													class="d-none d-md-block d-lg-none"
													:text="tx.from"
													:maxChars="40"/>
												<span class="d-none d-lg-block">{{ tx.from }}</span>
											</nuxt-link>
										</td>
									</tr>
									<tr>
										<td>To:</td>
										<td>
											<div v-if="tx.to">
												<i v-if="tx.to_model && tx.to_model.isContract" class="tm tm-icon-contract mr-1"></i>
												<nuxt-link :to="{name: 'address-slug', params: {slug: tx.to_model.hash}}">
													<read-more
														class="d-sm-none"
														:text="tx.to_model.hash" />
													<read-more
														class="d-none d-sm-inline-block d-md-none"
														:text="tx.to_model.hash"
														:maxChars="20"/>
													<read-more
														class="d-none d-md-inline-block d-lg-none"
														:text="tx.to_model.hash"
														:maxChars="40"/>
												<span class="d-none d-lg-inline-block">{{ tx.to_model.hash }}</span>
												</nuxt-link>
											</div>
											<div v-else>
												<span>[Contract&nbsp;</span>
												<nuxt-link :to="{name: 'address-slug', params: {slug: tx.to_model.hash}}">{{ tx.to_model.hash }}</nuxt-link>
												<span>&nbsp;Created]</span>
											</div>
										</td>
									</tr>
									<tr>
										<td>Value</td>
										<td>{{ formatUnit(toEther(tx.value)) }}</td>
									</tr>
									<tr>
										<td>Gas Used By Txn</td>
										<td>{{ tx.gasUsed }}</td>
									</tr>
									<tr>
										<td>Gas Price</td>
										<td>{{ formatUnit(toEther(tx.gasPrice)) }}({{ toGwei(tx.gasPrice) }} Gwei)</td>
									</tr>
									<tr>
										<td>Actual Tx Cost/Fee</td>
										<td>{{ formatUnit(toEther(tx.gasPrice * tx.gas)) }}</td>
									</tr>
									<tr v-if="tx.tokenTxs.length">
										<td>Token Transfer</td>
										<td>
											<ul>
												<li v-for="tokenTx, index in tx.tokenTxs">
													<span>{{ toEther(tokenTx.value) }}</span>
													<nuxt-link :to="{name: 'tokens-slug', params: {slug: tokenTx.address}}">
														<span v-if="tokenTx.symbol" v-html="'ERC20 (' + tokenTx.symbol + ')'"></span>
													</nuxt-link>
													<span>&nbsp;from&nbsp;</span>
													<nuxt-link :to="{name: 'address-slug', params: {slug: tokenTx.from}}">{{ tokenTx.from }}</nuxt-link>
													<span><i class="fa fa-arrow-right ml-1 mr-1 text-success"></i></span>
													<nuxt-link :to="{name: 'address-slug', params: {slug: tokenTx.to}}">{{ tokenTx.to }}</nuxt-link>
												</li>
											</ul>
										</td>
									</tr>
									<tr>
										<td>Input Data</td>
										<td>
											<span class="text-danger">
												<read-more
													class="d-sm-none"
													:text="tx.input"/>
												<read-more
													class="d-none d-sm-block d-md-none"
													:text="tx.input"
													:maxChars="20"/>
												<read-more
													class="d-none d-md-block"
													:text="tx.input"
													:maxChars="40"/>
											</span>
										</td>
									</tr>
									</tbody>
								</table>
							</div>
						</div>
					</b-tab>
					<b-tab :title="'Events (' + itemsLength + ')'">
						<table-event :tx="hash" :page="this"></table-event>
					</b-tab>
				</b-tabs>
			</b-col>
		</b-row>
	</section>
</template>
<script>
  import mixin from '~/plugins/mixin'
  import TableEvent from '~/components/TableEvent'
	import ReadMore from '~/components/ReadMore'

  export default {
    mixins: [mixin],
    components: {
      TableEvent,
			ReadMore
    },
    head () {
      return {
        title: 'Transaction ' + this.$route.params.slug + ' Info',
      }
    },
    data () {
      return {
        hash: null,
        tx: null,
        itemsLength: 0,
      	loading: true,
      }
    },
    created () {
      this.hash = this.$route.params.slug
    },
    async mounted () {
			let self = this
			self.loading = true
			
      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'txs-slug', to: {name: 'txs-slug', params: {slug: self.hash}}})

      let {data} = await this.$axios.get('/api/txs/' + self.hash)

      this.tx = data
      let moment = self.$moment(data.timestamp)
			this.tx.timestamp_moment = `${moment.fromNow()} <small>(${moment.format('MMM-DD-Y hh:mm:ss A')} +UTC)</small>`
			
      self.loading = false
    },
  }
</script>