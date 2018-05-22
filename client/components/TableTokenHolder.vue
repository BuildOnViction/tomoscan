<template>
	<section>
		<p class="tm__total">Total {{ formatNumber(total) }} items found</p>

		<b-table class="tm__table"
		         foot-clone
		         small
		         :fields="fields"
		         :loading="loading"
		         :items="items">
			<template slot="rank" slot-scope="props">
				<div class="tm__cell">
					{{ props.item.rank }}
				</div>
			</template>
			<template slot="hash" slot-scope="props">
				<div class="tm__cell">
					<nuxt-link :to="{name: 'address-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
				</div>
			</template>
			<template slot="quantity" slot-scope="props">
				<div class="tm__cell">
					{{ toEther(props.item.quantity) }}
				</div>
			</template>
			<template slot="percentAge" slot-scope="props">
				<div class="tm__cell">
					{{ props.item.percentAge }}
				</div>
			</template>
		</b-table>
		<b-pagination
			align="center"
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
        rank: {label: 'Rank'},
        hash: {label: 'Address'},
        quantity: {label: 'quantity', class: 'text-right'},
        percentAge: {label: 'Percentage', class: 'text-right'},
      },
      loading: true,
      pagination: {},
      total: 0,
      items: [],
      currentPage: 1,
      perPage: 15,
      pages: 1,
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
          params.address = self.address
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
