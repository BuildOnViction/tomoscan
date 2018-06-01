<template>
	<section>
		<p class="tomo-total-items">Total {{ formatNumber(total) }} items found</p>

		<table-base
			:fields="fields"
			:items="items">
			<template slot="hash" slot-scope="props">
				<nuxt-link class="address__tag" :to="{name: 'tokens-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
			</template>

			<template slot="name" slot-scope="props">
				<nuxt-link :to="{name: 'tokens-slug', params: {slug: props.item.hash}}">
					{{ trimWord(props.item.name) }}
				</nuxt-link>
			</template>

			<template slot="symbol" slot-scope="props">{{ props.item.symbol }}</template>

			<template slot="totalSupply" slot-scope="props">{{ formatNumber(props.item.totalSupply) }} {{ props.item.symbol }}</template>

			<template slot="totalSupply" slot-scope="props">{{ formatNumber(props.item.totalSupply) }} {{ props.item.symbol }}</template>
		</table-base>

		<b-pagination
			align="center"
      class="tomo-pagination"
			:total-rows="total"
			:per-page="perPage"
			@change="onChangePaginate"
		></b-pagination>
	</section>
</template>
<script>
  import mixin from '~/plugins/mixin'
  import TableBase from '~/components/TableBase'

  export default {
    components: {
      TableBase,
    },
    mixins: [mixin],
    data: () => ({
      fields: {
        hash: {label: 'Hash'},
        name: {label: 'Name', tdClass: 'text-left'},
        symbol: {label: 'Symbol'},
        totalSupply: {label: 'totalSupply', thClass: 'text-center', tdClass: 'text-right'},
        decimals: {label: 'Decimals', thClass: 'text-center', tdClass: 'text-right'},
        tokenTxsCount: {label: 'TxCount'},
      },
      loading: true,
      pagination: {},
      total: 0,
      items: [],
      currentPage: 1,
      perPage: 15,
      pages: 1,
    }),
    mounted () {
      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'tokens', to: {name: 'tokens'}})

      let self = this
      let query = self.$route.query
      if (query.page) {
        self.currentPage = parseInt(query.page)
      }
      if (query.limit) {
        self.perPage = parseInt(query.limit)
      }

      this.getDataFromApi()
    },
    methods: {
      async getDataFromApi () {
        let self = this

        // Show loading.
        self.loading = true

        let params = {
          page: self.currentPage,
          limit: self.perPage,
        }
        this.$router.replace({query: params})

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/tokens' + '?' + query)
        self.items = data.items
        self.total = data.total
        self.currentPage = data.currentPage
        self.pages = data.pages

        // Hide loading.
        self.loading = false

        return data
      },
      onChangePaginate (page) {
        let self = this
        self.currentPage = page

        self.getDataFromApi()
      },
    },
  }
</script>

<style lang="scss" scoped type="text/scss">
</style>