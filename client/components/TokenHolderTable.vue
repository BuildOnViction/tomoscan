<template>
	<section>
		<b-table
			striped
			responsive
			foot-clone
			small
			:fields="fields"
			:loading="loading"
			:items="items">
			<template slot="hash" slot-scope="props">
				<nuxt-link class="address__tag" :to="{name: 'address-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
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
        rank: {label: 'Rank'},
        hash: {label: 'Address'},
        quantity: {label: 'quantity'},
        percentAge: {label: 'Percentage'},
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
    created () {
      // Format fields.
      if (this.address) {
        delete this.fields.token
      }
    },
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

        this.$router.replace({query: params})

        if (self.address) {
          params.address = self.address
        }

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/token-holders' + '?' + query)
        self.items = data.items
        self.total = data.total
        self.current_page = data.current_page
        self.pages = data.pages

        // Format data.
        self.items = self.formatData(self.items)

        // Hide loading.
        self.loading = false

        return data
      },
      formatData (items = []) {
        let _items = []
        items.forEach((item) => {
          let _item = item

          // Format for timestamp.
          if (!item.block) {
            _item.timestamp = item.createdAt
          }

          _items.push(_item)
        })

        return _items
      },
      onChangePaginate (page) {
        let self = this
        self.current_page = page

        self.getDataFromApi()
      },
    },
  }
</script>
