<template>
	<section>
		<p class="lead">TXID: {{ hash }}</p>
		<b-row>
			<b-col>
				<table v-if="tx" class="datatable table">
					<tbody>
					<tr>
						<td>TxHash:</td>
						<td>{{ tx.hash }}</td>
					</tr>
					<tr>
						<td>Block:</td>
						<td>
							<nuxt-link v-if="tx.blockNumber" :to="{name: 'blocks-slug', params: {slug:tx.blockNumber}}">{{ tx.blockNumber }}</nuxt-link>
							<span v-else class="text-muted">Pending...</span>
						</td>
					</tr>
					<tr>
						<td>TimeStamp:</td>
						<td>{{ tx.timestamp_moment }}</td>
					</tr>
					<tr>
						<td>From:</td>
						<td>
							<i v-if="tx.from_model && tx.from_model.isContract" class="fa fa-file-text-o mr-1"></i>
							<nuxt-link :to="{name: 'address-slug', params: {slug: tx.from}}">{{ tx.from }}</nuxt-link>
						</td>
					</tr>
					<tr>
						<td>To:</td>
						<td>
							<div v-if="tx.to">
								<i v-if="tx.to_model && tx.to_model.isContract" class="fa fa-file-text-o mr-1"></i>
								<nuxt-link :to="{name: 'address-slug', params: {slug: tx.to_model.hash}}">{{ tx.to_model.hash }}</nuxt-link>
							</div>
							<div v-else>
								<span>[Contract&nbsp;</span>
								<nuxt-link :to="{name: 'address-slug', params: {slug: tx.to_model.hash}}">{{ tx.to_model.hash }}</nuxt-link>
								<span>&nbsp;Created]</span>
							</div>
						</td>
					</tr>
					<tr>
						<td>Value:</td>
						<td>{{ formatUnit(toEther(tx.value)) }}</td>
					</tr>
					<tr>
						<td>Gas Used By Txn:</td>
						<td>{{ tx.gasUsed }}</td>
					</tr>
					<tr>
						<td>Gas Price:</td>
						<td>{{ formatUnit(toEther(tx.gasPrice)) }}({{ toGwei(tx.gasPrice) }} Gwei)</td>
					</tr>
					<tr>
						<td>Actual Tx Cost/Fee:</td>
						<td>{{ formatUnit(toEther(tx.gasPrice * tx.gas)) }}</td>
					</tr>
					<tr v-if="tx.tokenTxs.length">
						<td>Token Transfer:</td>
						<td>
							<ul>
								<li v-for="tokenTx, index in tx.tokenTxs">
									<span>{{ toEther(tokenTx.value) }}</span>
									<nuxt-link :to="{name: 'tokens-slug', params: {slug: tokenTx.address}}">
										<span v-html="'ERC20 (' + tokenTx.symbol.trim() + ')'"></span>
									</nuxt-link>
									<span>&nbsp;from&nbsp;</span>
									<nuxt-link class="address__tag" :to="{name: 'accounts-slug', params: {slug: tokenTx.from}}">{{ tokenTx.from }}</nuxt-link>
									<span><i class="fa fa-arrow-right ml-1 mr-1 text-success"></i></span>
									<nuxt-link class="address__tag" :to="{name: 'accounts-slug', params: {slug: tokenTx.to}}">{{ tokenTx.to }}</nuxt-link>
								</li>
							</ul>
						</td>
					</tr>
					<tr>
						<td>Input Data:</td>
						<td>
							<figure class="highlight">
								<code>{{ tx.input }}</code>
							</figure>
						</td>
					</tr>
					</tbody>
				</table>
			</b-col>
		</b-row>
	</section>
</template>
<script>
  import mixin from '~/plugins/mixin'

  export default {
    mixins: [mixin],
    head () {
      return {
        title: 'Transaction ' + this.$route.params.slug + ' Info',
      }
    },
    data () {
      return {
        hash: null,
        tx: null,
      }
    },
    created () {
      this.hash = this.$route.params.slug
    },
    async mounted () {
      let self = this

      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'txs-slug', to: {name: 'txs-slug', params: {slug: self.hash}}})

      let {data} = await this.$axios.get('/api/txs/' + self.hash)

      this.tx = data
      let moment = this.moment(data.timestamp)
      this.tx.timestamp_moment = moment.fromNow() + ' (' + moment.format('MMM-DD-Y hh:mm:ss A') + ')'
    },
  }
</script>