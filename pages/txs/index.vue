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
					<span class="address__tag">
						<nuxt-link :to="{name: 'txs-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
					</span>
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
					<span class="address__tag">{{ props.item.from }}</span>
				</td>
				<td>
					<v-icon color="green">mdi-arrow-right-bold</v-icon>
				</td>
				<td>
					<span class="address__tag">
						<span v-if="props.item.to != null"></span>
						<span v-else>
							<v-icon>mdi-file-document</v-icon>
							{{ props.item.contractAddress }}
						</span>
					</span>
				</td>
				<td>{{ toEther(props.item.value) }} Ether</td>
				<td>{{ toEther(props.item.gasPrice * props.item.gas) }}</td>
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
  import web3 from 'web3'

  export default {
    mixins: [mixin],
    components: {
      Paginate,
    },
    head: () => ({
      title: 'Transactions',
    }),
    data: () => ({
      headers: [
        {text: 'TxHash', value: 'hash'},
        {text: 'Age', value: 'timestamp', sortable: false, width: '120px'},
        {text: 'from', value: 'from'},
        {text: 'arrow'},
        {text: 'to', value: 'to'},
        {text: 'Value', value: 'value'},
        {text: 'TxFee', value: 'gasPrice'},
      ],
      loading: true,
      pagination: {},
      total: 0,
      items: [],
      current_page: 1,
      per_page: 15,
      pages: 1,
      block: null,
    }),
    async mounted () {
      let self = this
      let query = self.$route.query
      if (query.page) {
        self.current_page = parseInt(query.page)
      }
      if (query.limit) {
        self.per_page = parseInt(query.limit)
      }
      if (query.block) {
        self.block = query.block
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
        if (self.block) {
          params.block = self.block
        }
        this.$router.push({query: params})

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/txs' + '?' + query)
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
