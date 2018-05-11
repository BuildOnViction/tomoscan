<template>
	<section>
		<p>Total {{ formatNumber(total) }} items found</p>

		<b-table
			striped
			responsive
			foot-clone
			small
			:fields="fields"
			:loading="loading"
			:items="items">
			<template slot="hash" slot-scope="props">
				<nuxt-link :to="{name: 'tokens-slug', params: {slug: props.item.token}}">{{ props.item.token }}</nuxt-link>
			</template>
			<template slot="quantity" slot-scope="props">
				{{ formatUnit(toEther(props.item.quantity), props.item.tokenObj.symbol) }}
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
  import mixin from '~/plugins/mixin'

  export default {
    mixins: [mixin],
    props: {
      address: {type: String, default: null},
    },
    data: () => ({
      fields: {
        hash: {label: 'Token'},
        quantity: {label: 'Quantity', class: 'text-right'},
      },
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
      // Init from router.
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

        this.$router.replace({query: params})

        if (self.address) {
          params.hash = self.address
        }

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/token-holders' + '?' + query)
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
    },
  }
</script>
