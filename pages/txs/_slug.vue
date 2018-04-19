<template>
	<div>
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
							<nuxt-link :to="{name: 'blocks-slug', params: {slug:tx.blockNumber}}">{{ tx.blockNumber }}</nuxt-link>
						</td>
					</tr>
					<tr>
						<td>TimeStamp:</td>
						<td>{{ tx.timestamp_moment }}</td>
					</tr>
					<tr>
						<td>From:</td>
						<td>
							<nuxt-link :to="{name: 'address-slug', params: {slug: tx.from}}">{{ tx.from }}</nuxt-link>
						</td>
					</tr>
					<tr>
						<td>To:</td>
						<td>
							<nuxt-link v-if="tx.to" :to="{name: 'address-slug', params: {slug: tx.to}}">{{ tx.to }}</nuxt-link>
							<nuxt-link v-else :to="{name: 'address-slug', params: {slug: tx.contractAddress}}">{{ tx.contractAddress }}</nuxt-link>
						</td>
					</tr>
					<tr>
						<td>Value:</td>
						<td>{{ formatUnit(toEther(tx.value)) }}</td>
					</tr>
					<tr>
						<td>Gas Limit:</td>
						<td>{{ tx.gasLimit }}</td>
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
	</div>
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
    async mounted () {
      let self = this
      self.hash = this.$route.params.slug

      // Init breadcrumbs data.
      this.$store.dispatch('breadcrumb/setData', 'txs-slug', {name: 'txs-slug', params: {slug: self.hash}})

      let {data} = await this.$axios.get('/api/txs/' + self.hash)

      this.tx = data
      let moment = this.moment(data.timestamp)
      this.tx.timestamp_moment = moment.fromNow() + ' (' + moment.format('MMM-DD-Y hh:mm:ss A') + ')'
    },
  }
</script>