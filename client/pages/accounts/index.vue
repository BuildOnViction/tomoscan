<template>
	<section>
		<b-table
			striped
			responsive
			foot-clone
			:fields="fields"
			:loading="loading"
			:items="items">
			<template slot="rank" slot-scope="props">
				{{ props.item.rank }}
			</template>
			<template slot="hash" slot-scope="props">
				<nuxt-link :to="{name: 'address-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
			</template>
			<template slot="balance" slot-scope="props">
				<span v-html="formatUnit(toEther(props.item.balance))"></span>
			</template>
			<template slot="transactionCount" slot-scope="props">
				{{ formatNumber(props.item.transactionCount) }}
			</template>
		</b-table>

		<b-pagination
			align="center"
			:total-rows="total"
			:per-page="per_page"
			@change="onChangePaginate"
		></b-pagination>
	</section>
</template>

<script>
  import axios from '~/plugins/axios'
  import mixin from '~/plugins/mixin'

  export default {
    mixins: [mixin],
    head: () => ({
      title: 'Accounts',
    }),
    data: () => ({
      fields: {
        rank: {label: 'Rank'},
        hash: {label: 'Address'},
        balance: {label: 'Balance', tdClass: 'text-right', thClass: 'text-center'},
        transactionCount: {label: 'TxCount', tdClass: 'text-right', thClass: 'text-center'},
      },
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
      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'accounts', to: {name: 'accounts'}})

      // Get query data.
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
        this.$router.replace({query: params})

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

      onChangePaginate (page) {
        let self = this
        self.current_page = page

        self.getDataFromApi()
      },

      linkGen (page_numb) {
        let self = this
        let query = {
          page: page_numb,
          limit: self.per_page,
        }

        return {
          name: 'accounts',
          query: query,
        }
      },
    },
  }
</script>

<style scoped>
</style>
