<template>
	<section>
		<b-row class="mb-5">
			<b-col>
				<h3>Block #{{ number }}</h3>
				<p class="lead">Information on block #{{ number }}</p>

				<div v-if="block">
					<table class="datatable table">
						<tbody>
						<tr>
							<td>Height:</td>
							<td>
								<b-button-group size="sm">
									<b-button variant="primary" :to="{name: 'blocks-slug', params: {slug: block.number - 1}}">Prev</b-button>
									<b-button variant="outline-primary">{{ block.number }}</b-button>
									<b-button variant="primary" :to="{name: 'blocks-slug', params: {slug: block.number + 1}}">Next</b-button>
								</b-button-group>
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
			</b-col>
		</b-row>
	</section>
</template>
<script>
  import mixin from '~/plugins/mixin'
  import TxTable from '~/components/TxTable'

  export default {
    mixins: [mixin],
    components: {TxTable},
    head () {
      return {
        title: 'Block ' + this.$route.params.slug + ' Info',
      }
    },
    data () {
      return {
        number: null,
        block: null,
        timestamp_moment: null,
      }
    },
    created () {
      let number = this.$route.params.slug
      if (number) {
        this.number = number
      }
    },
    async mounted () {
      let self = this
      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'blocks-slug', to: {name: 'blocks-slug', params: {slug: self.number}}})

      let {data} = await this.$axios.get('/api/blocks/' + this.$route.params.slug)

      this.block = data
      let moment = this.moment(data.timestamp)
      this.timestamp_moment = moment.fromNow() + ' (' + moment.format('MMM-DD-Y hh:mm:ss A') + ' +UTC)'
    },
  }
</script>