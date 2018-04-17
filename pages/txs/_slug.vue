<template>
	<div>
		<v-tabs>
			<v-tab>Overview</v-tab>
			<v-tab-item>
				<v-card flat>
					<div v-if="tx" class="table__overflow">
						<table class="datatable table">
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
									<nuxt-link :to="{name: 'txs-slug', params: {slug: tx.from}}">{{ tx.from }}</nuxt-link>
								</td>
							</tr>
							<tr>
								<td>To:</td>
								<td>
									<nuxt-link :to="{name: 'txs-slug', params: {slug: tx.to}}">{{ tx.to }}</nuxt-link>
								</td>
							</tr>
							<tr>
								<td>Value:</td>
								<td>{{ toEther(tx.value) }}</td>
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
								<td>{{ toEther(tx.gasPrice) }}({{ toGwei(tx.gasPrice) }} Gwei)</td>
							</tr>
							<tr>
								<td>Actual Tx Cost/Fee:</td>
								<td>{{ toEther(tx.gasPrice * tx.gas) }}</td>
							</tr>
							<tr>
								<td>Input Data:</td>
								<td>
									<v-text-field
									textarea
									label="Input Data:"
									:value="tx.input"
									>
									</v-text-field>
								</td>
							</tr>
							</tbody>
						</table>
					</div>
				</v-card>
			</v-tab-item>
		</v-tabs>
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
        tx: null,
      }
    },
    async mounted () {
      let {data} = await this.$axios.get('/api/txs/' + this.$route.params.slug)

      this.tx = data
      let moment = this.moment(data.timestamp)
      this.tx.timestamp_moment = moment.fromNow() + ' (' + moment.format('MMM-DD-Y hh:mm:ss A') + ')'
    },
  }
</script>