<template>
	<div>
		<v-tabs>
			<v-tab>Overview</v-tab>
			<v-tab-item>
				<v-card flat>
					<div v-if="block" class="table__overflow">
						<table class="datatable table">
							<tbody>
							<tr>
								<td>Height:</td>
								<td>
									<v-btn small color="primary" :to="{name: 'blocks-slug', params: {slug: block.number - 1}}">Prev
									</v-btn>
									<v-btn small>{{ block.number }}</v-btn>
									<v-btn small color="primary" :to="{name: 'blocks-slug', params: {slug: block.number + 1}}">Next
									</v-btn>
								</td>
							</tr>
							<tr v-if="timestamp_moment">
								<td>TimeStamp:</td>
								<td>{{ timestamp_moment }}</td>
							</tr>
							<tr>
								<td>Transactions:</td>
								<td>
									<nuxt-link :to="{name: 'txs', query:{block: block.number}}">{{ block.e_tx }}&nbsp;transactions</nuxt-link>
								</td>
							</tr>
							<tr>
								<td>Hash</td>
								<td>{{ block.hash }}</td>
							</tr>
							<tr>
								<td>Parent Hash:</td>
								<td>
									<nuxt-link :to="{name: 'blocks-slug', params: {slug: block.parentHash}}">{{ block.parentHash }}
									</nuxt-link>
								</td>
							</tr>
							<tr>
								<td>Sha3Uncles:</td>
								<td>{{ block.sha3Uncles }}</td>
							</tr>
							<tr>
								<td>Mined By:</td>
								<td>
									<nuxt-link :to="{name: 'address-slug', params: {slug: block.signer}}">
										<span v-if="block.signer">{{ block.signer }}</span>
										<span v-else>{{ block.miner }}</span>
									</nuxt-link>
								</td>
							</tr>
							<tr>
								<td>Difficulty:</td>
								<td>{{ formatNumber(block.difficulty) }}</td>
							</tr>
							<tr>
								<td>Total Difficulty:</td>
								<td>{{ formatNumber(block.totalDifficulty) }}</td>
							</tr>
							<tr>
								<td>Gas Used:</td>
								<td>{{ formatNumber(block.gasUsed) }}</td>
							</tr>
							<tr>
								<td>Gas Limit:</td>
								<td>{{ formatNumber(block.gasLimit) }}</td>
							</tr>
							<tr>
								<td>Nonce:</td>
								<td>{{ block.nonce }}</td>
							</tr>
							<tr>
								<td>Extra Data:</td>
								<td>{{ block.extraData }}</td>
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
        title: 'Block ' + this.$route.params.slug + ' Info',
      }
    },
    data () {
      return {
        block: null,
        timestamp_moment: null
      }
    },
    async mounted () {
      let {data} = await this.$axios.get('/api/blocks/' + this.$route.params.slug)

      this.block = data
      let moment = this.moment(data.timestamp)
      this.timestamp_moment = moment.fromNow() + ' (' + moment.format('MMM-DD-Y hh:mm:ss A') + ' +UTC)'
	    console.log(this.block)
    },
  }
</script>