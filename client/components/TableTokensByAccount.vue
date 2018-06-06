<template>
	<section>
		<p class="tomo-total-items">Total {{ formatNumber(total) }} items found</p>

		<div class="tm__table">
			<div class="tm__table_heading">
				<div class="row">
					<div class="col" v-for="field in fields">
						{{ field.label }}
					</div>
				</div>
			</div>
			<div class="tm__table_body">
				<div class="row tm__table_row" v-for="(item, index) in items">
					<div class="col tm__table_cell" v-for="(field, key) in fields">
						<div v-if="key === 'hash'">
							<nuxt-link :to="{name: 'tokens-slug', params: {slug: item.token}}">{{ item.tokenObj ? item.tokenObj.name : item.token }}</nuxt-link>
						</div>

						<div v-if="key === 'quantity'">{{ formatUnit(convertHexToFloat(item.quantity, 16), item.tokenObj.symbol) }}</div>
					</div>
				</div>
			</div>
		</div>

		<b-pagination
			v-model="currentPage"
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

  export default {
    mixins: [mixin],
    props: {
      address: {type: String, default: null},
    },
    data: () => ({
      fields: {
        hash: {label: 'Token'},
        quantity: {label: 'Quantity'},
      },
      loading: true,
      pagination: {},
      total: 0,
      items: [],
      currentPage: 1,
      perPage: 15,
      pages: 1,
      block: null,
    }),
    async mounted () {
      let self = this
      // Init from router.
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

        if (self.address) {
          params.hash = self.address
        }

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/token-holders' + '?' + query)
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
