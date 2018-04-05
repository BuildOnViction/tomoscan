<template>
	<div>
		<v-data-table
			:headers="headers"
			:rows-per-page-items="[10,25,50]"
			:pagination.sync="pagination"
			:loading="loading"
			:total-items="total"
			:items="items">
			<template slot="items" slot-scope="props">
				<td></td>
				<td>{{ props.item.hash }}</td>
				<td class="text-xs-right">{{ props.item.balance }}</td>
				<td></td>
				<td class="text-xs-right">{{ props.item.transactionCount }}</td>
			</template>
			<template slot="pageText" slot-scope="props">
				Rows per page: {{ props.pageStart }} - {{ props.pageStop }} of {{ props.itemsLength }}
			</template>
		</v-data-table>
		<div class="text-xs-center pt-2">
			<v-pagination @input="getDataFromApi" v-model="pagination.page" :length="pages"></v-pagination>
		</div>
	</div>
</template>

<script>
  import axios from '~/plugins/axios'
  import serializeQuery from '../../plugins/mixin'

  export default {
    async mounted () {
      let self = this
      await this.getDataFromApi()
    },
    head: () => ({
      title: 'Accounts',
    }),
    computed: {
      pages () {
        if (this.pagination.rowsPerPage == null ||
          this.pagination.totalItems == null
        ) return 0

        return Math.ceil(this.pagination.totalItems / this.pagination.rowsPerPage)
      },
    },
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
    }),
    watch: {
      pagination: {
        handler () {
          this.getDataFromApi()
        },
      },
    },
    methods: {
      async getDataFromApi () {
        let self = this
        self.loading = true
        const {sortBy, descending, page, rowsPerPage} = self.pagination
        let params = {
          limit: rowsPerPage,
          page: page,
        }
        let query = serializeQuery(params)
        let {data} = await this.$axios.get('/api/accounts' + '?' + query)
        self.loading = false
        self.items = data.items
        self.total = data.total
      },
    },
  }
</script>

<style scoped>
	.title {
		margin: 30px 0;
	}

	.users {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.user {
		margin: 10px 0;
	}
</style>
