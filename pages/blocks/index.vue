<template>
	<div>
		<v-data-table
			:headers="headers"
			:rows-per-page-items="[10,25,50]"
			:loading="loading"
			:total-items="total"
			:hide-actions="true"
			:disable-initial-sort="true"
			:items="items">
			<template slot="items" slot-scope="props">
				<td>
					<nuxt-link :to="{name: 'blocks-slug', params: {slug: props.item.number}}">{{ props.item.number }}</nuxt-link>
				</td>
				<td>
					<v-tooltip bottom>
						<div slot="activator">
							{{ moment(props.item.timestamp).fromNow() }}
						</div>
						<div>
							{{ moment(props.item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
						</div>
					</v-tooltip>
				</td>
				<td>
					<nuxt-link :to="{name: 'txs', query: {block: props.item.number}}">{{ props.item.e_tx }}</nuxt-link>
				</td>
				<td>{{ props.item.uncles.length }}</td>
				<td>
					<span class="address__tag">
						<nuxt-link :to="{name: 'address-slug', params: {slug: props.item.signer}}">
							<span v-if="props.item.signer">{{ props.item.signer }}</span>
							<span v-else>{{ props.item.miner }}</span>
						</nuxt-link>
					</span>
				</td>
				<td class="text-xs-right">
					<div>{{ formatNumber(props.item.gasUsed) }}</div>
					<small>({{ formatNumber(100 * props.item.gasUsed / props.item.gasLimit) }} %)</small>
				</td>
				<td class="text-xs-right">{{ formatNumber(props.item.gasLimit) }}</td>
				<td class="text-xs-right">{{ formatNumber(toGwei(props.item.avgGasPrice)) }}</td>
				<td>{{ formatUnit(toEther(props.item.reward)) }}</td>
			</template>
		</v-data-table>
		<div class="text-xs-center pt-2">
			<paginate :current_page="current_page" :last_page="pages" @update-pagination="onChangePaginate"></paginate>
		</div>
	</div>
</template>

<script>
  import mixin from '~/plugins/mixin'
  import Paginate from '~/components/Paginate'

  export default {
    mixins: [mixin],
    components: {
      Paginate,
    },
    head: () => ({
      title: 'Blocks',
    }),
    data: () => ({
      headers: [
        {text: 'Number', value: 'number'},
        {text: 'Age', value: 'timestamp'},
        {text: 'txn', value: 'e_tx'},
        {text: 'Uncles', value: 'uncles'},
        {text: 'Miner', value: 'miner'},
        {text: 'GasUsed', value: 'gasUsed'},
        {text: 'GasLimit', value: 'gasLimit'},
        {text: 'Avg.GasPrice', value: 'avgGasPrice'},
        {text: 'Reward', value: 'reward'},
      ],
      loading: true,
      pagination: {},
      total: 0,
      items: [],
      current_page: 1,
      per_page: 15,
      pages: 1,
    }),
    mounted () {
      let self = this
      let query = self.$route.query
      if (query.page) {
        self.current_page = parseInt(query.page)
      }
      if (query.limit) {
        self.per_page = parseInt(query.limit)
      }

      this.getDataFromApi()
    },
    methods: {
      async getDataFromApi () {
        let self = this

        // Show loading.
        self.loading = true

        let params = {
          page: self.current_page,
          limit: self.per_page,
        }
        this.$router.push({query: params})

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/blocks' + '?' + query)
        self.items = data.items
        self.total = data.total
        self.current_page = data.current_page
        self.pages = data.pages

        // Hide loading.
        self.loading = false

        return data
      },
      onChangePaginate ({page}) {
        let self = this
        self.current_page = page

        self.getDataFromApi()
      },
    },
  }
</script>

<style scoped>
</style>
