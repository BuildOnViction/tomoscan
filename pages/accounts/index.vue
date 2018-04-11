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
				<td></td>
				<td>
					<span class="address__tag">{{ props.item.hash }}</span>
				</td>
				<td class="text-xs-right">{{ toEther(props.item.balance) }}</td>
				<td></td>
				<td class="text-xs-right">{{ props.item.transactionCount }}</td>
			</template>
			<template slot="pageText" slot-scope="props">
				Rows per page: {{ props.pageStart }} - {{ props.pageStop }} of {{ props.itemsLength }}
			</template>
		</v-data-table>
		<div class="text-xs-center pt-2">
			<paginate :current_page="current_page" :last_page="pages" @update-pagination="onChangePaginate"></paginate>
		</div>
	</div>
</template>

<script>
  import axios from '~/plugins/axios'
  import mixin from '~/plugins/mixin'
  import Paginate from '~/components/Paginate'

  export default {
    mixins: [mixin],
    components: {
      Paginate,
    },
    head: () => ({
      title: 'Accounts',
    }),
    data: () => ({
      headers: [
        {text: 'Rank', value: 'rank'},
        {text: 'Address', value: 'hash', align: 'left', sortable: false},
        {text: 'Balance', value: 'balance'},
        {text: 'Percentage', value: 'percentage'},
        {text: 'TxCount', value: 'transactionCount'},
      ],
      loading: true,
      pagination: {},
      total: 0,
      items: [],
      current_page: 1,
      per_page: 15,
      pages: 1,
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

      await self.getDataFromApi()
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
        let {data} = await this.$axios.get('/api/accounts' + '?' + query)
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
