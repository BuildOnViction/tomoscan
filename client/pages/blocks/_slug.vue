<template>
	<div
			v-if="loading"
			:class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
	<section v-else>
		<div class="card tomo-card tomo-card--block">
			<div class="tomo-card__header">
				<h3
					v-if="block"
					class="tomo-card__headline">Block
						<span class="d-none d-lg-inline-block headline__block-number">#{{ block.number }}</span>
				</h3>
				<div
					v-if="block"
					class="block-breadcrumb">
					<div class="block-breadcrumb__prev">
						<i class="tm tm-chevrons-left"></i>
						<nuxt-link :to="{name: 'blocks-slug', params: {slug: block.number - 1}}">Prev</nuxt-link>
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
							<td>{{ block.e_tx }} transactions</td>
						</tr>
						<tr>
							<td>Hash</td>
							<td>
								<read-more
									class="d-sm-none"
									:text="block.hash" />
								<read-more
									class="d-none d-sm-block d-md-none"
									:text="block.hash"
									:maxChars="20"/>
								<read-more
									class="d-none d-md-block d-lg-none"
									:text="block.hash"
									:maxChars="40"/>
								<span class="d-none d-lg-block">{{ block.hash }}</span>
							</td>
						</tr>
						<tr>
							<td>Parent Hash</td>
							<td>
								<nuxt-link :to="{name: 'blocks-slug', params: {slug: block.number - 1}}">
									<read-more
										 class="d-sm-none"
										:text="block.parentHash" />
									<read-more
										class="d-none d-sm-block d-md-none"
										:text="block.parentHash"
										:maxChars="20"/>
									<read-more
										class="d-none d-md-block d-lg-none"
										:text="block.parentHash"
										:maxChars="40"/>
									<span class="d-none d-lg-block">{{ block.parentHash }}</span>
								</nuxt-link>
							</td>
						</tr>
						<tr>
							<td>Mined By</td>
							<td>
								<nuxt-link
									class="d-sm-none"
									:to="{name: 'address-slug', params: {slug: block.signer}}">
									<read-more
										v-if="block.signer"
										:text="block.signer" />
									<read-more
										v-else
										:text="block.miner" />
								</nuxt-link>
								<nuxt-link
									class="d-none d-sm-block d-md-none"
									:to="{name: 'address-slug', params: {slug: block.signer}}">
									<read-more
										v-if="block.signer"
										:text="block.signer"
										:maxChars="20" />
									<read-more
										v-else
										:text="block.miner"
										:maxChars="20" />
								</nuxt-link>
								<nuxt-link
									class="d-none d-md-block"
									:to="{name: 'address-slug', params: {slug: block.signer}}">
									<span
										v-if="block.signer"
										:text="block.signer"
										:maxChars="20">{{ block.signer }}</span>
									<span
										v-else
										:maxChars="20">{{ block.miner }}</span>
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
							<td>
									<read-more
										class="d-sm-none"
										:text="block.nonce"/>
									<read-more
										class="d-none d-sm-block"
										:text="block.nonce"
										:maxChars="20"/>
							</td>
						</tr>
						<tr>
							<td>Extra Data</td>
							<td>
								<read-more
									class="d-sm-none"
									:text="block.extraData"/>
								<read-more
									class="d-none d-sm-block d-md-none"
									:text="block.extraData"
									:maxChars="20"/>
								<read-more
									class="d-none d-md-block"
									:text="block.extraData"
									:maxChars="40"/>
							</td>
						</tr>
						</tbody>
					</table>
				</div>
			</div>

		<b-tabs class="tomo-tabs">
			<b-tab
				:title="'Transactions (' + txsCount + ')'">
				<table-tx :block="number.toString()"  :page="this"></table-tx>
			</b-tab>
		</b-tabs>
	</section>
</template>
<script>
  import mixin from '~/plugins/mixin'
	import TableTx from '~/components/TableTx'
	import ReadMore from '~/components/ReadMore'

  export default {
    mixins: [mixin],
		components: {
			TableTx,
			ReadMore
		},
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
				loading: true,
				txsCount: 0
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
			
			self.loading = true
			
      // Init breadcrumbs data.
			this.$store.commit('breadcrumb/setItems', {name: 'blocks-slug', to: {name: 'blocks-slug', params: {slug: self.number}}})

      let {data} = await this.$axios.get('/api/blocks/' + this.$route.params.slug)

      this.block = data
      let moment = self.$moment(data.timestamp)
			this.timestamp_moment = `${moment.fromNow()} <small>(${moment.format('MMM-DD-Y hh:mm:ss A')} +UTC)</small>`
			
			self.loading = false
    },
  }
</script>
