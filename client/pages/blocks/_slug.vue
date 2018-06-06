<template>
	<section>
		<div class="card tomo-card">
			<div class="tomo-card__header">
				<img src="~/assets/img/icon-block.png">
				<h3 class="tomo-card__headline">Block #{{ number }}</h3>
				<div
					v-if="block"
					class="block-breadcrumb">
					<div class="block-breadcrumb__prev">
						<i class="tm tm-chevrons-left"></i>
						<nuxt-link :to="{name: 'blocks-slug', params: {slug: block.number - 1}}">Back</nuxt-link>
					</div>
					<span class="block-breadcrumb__divider">|</span>
					<div class="block-breadcrumb__next">
						<nuxt-link :to="{name: 'blocks-slug', params: {slug: block.number + 1}}">Next</nuxt-link>
						<i class="tm tm-chevrons-right"></i>
					</div>
					</div>
				</div>
			<div class="tomo-card__body">
				<table
					v-if="block"
					class="tomo-card__table">
						<tbody>
						<tr>
							<td>Height</td>
							<td>{{ block.number }}</td>
						</tr>
						<tr v-if="timestamp_moment">
							<td>TimeStamp</td>
							<td v-html="timestamp_moment"></td>
						</tr>
						<tr>
							<td>Transactions</td>
							<td>{{ block.e_tx }}&nbsp;transactions</td>
						</tr>
						<tr>
							<td>Hash</td>
							<td>{{ formatLongString(block.hash, 12) }}</td>
						</tr>
						<tr>
							<td>Parent Hash</td>
							<td>
								<nuxt-link :to="{name: 'blocks-slug', params: {slug: block.parentHash}}">
									{{ formatLongString(block.parentHash, 12) }}
								</nuxt-link>
							</td>
						</tr>
						<tr>
							<td>Mined By</td>
							<td>
								<nuxt-link :to="{name: 'address-slug', params: {slug: block.signer}}">
									<span v-if="block.signer">{{ formatLongString(block.signer, 12) }}</span>
									<span v-else>{{ formatLongString(block.miner, 12) }}</span>
								</nuxt-link>
							</td>
						</tr>
						<tr>
							<td>Difficulty</td>
							<td>{{ formatNumber(block.difficulty) }}</td>
						</tr>
						<tr>
							<td>Total Difficulty</td>
							<td>{{ formatNumber(block.totalDifficulty) }}</td>
						</tr>
						<tr>
							<td>Gas Used</td>
							<td>{{ formatNumber(block.gasUsed) }}</td>
						</tr>
						<tr>
							<td>Gas Limit</td>
							<td>{{ formatNumber(block.gasLimit) }}</td>
						</tr>
						<tr>
							<td>Nonce</td>
							<td>{{ formatLongString(block.nonce, 12) }}</td>
						</tr>
						<tr>
							<td>Extra Data</td>
							<td>{{ formatLongString(block.extraData, 12) }}</td>
						</tr>
						</tbody>
					</table>
				</div>
			</div>

		<b-tabs class="mt-5">
			<b-tab title="Transactions">
				<table-tx :block="number"></table-tx>
			</b-tab>
		</b-tabs>
	</section>
</template>
<script>
  import mixin from '~/plugins/mixin'
  import TableTx from '~/components/TableTx'

  export default {
    mixins: [mixin],
    components: {TableTx},
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
      let moment = self.$moment(data.timestamp)
      this.timestamp_moment = `${moment.fromNow()} <small>(${moment.format('MMM-DD-Y hh:mm:ss A')} +UTC)</small>`
    },
  }
</script>
<style lang="scss" type="text/scss">
	.tm__block_table {
		overflow: auto;
		width: 100%;
		display: block;

		td {
			padding-top: 20px;
			padding-bottom: 20px;
		}

		tr {
			td:first-child {
				color: #868f9b;
			}
		}
	}
</style>