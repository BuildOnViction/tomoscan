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

			<template slot="block" slot-scope="props">
				<nuxt-link :to="{name: 'blocks-slug', params: {slug: props.item.number}}">{{ props.item.number }}</nuxt-link>
			</template>

			<template slot="timestamp" slot-scope="props">
				<div v-if="props.item.timestamp">
					<span :id="'age__' + props.index">{{ moment(props.item.timestamp).fromNow() }}</span>
					<b-tooltip :target="'age__' + props.index">
						{{ moment(props.item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
					</b-tooltip>
				</div>
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
      token: {type: String, default: null},
    },
    data: () => ({
      fields: {
        block: {label: 'Block'},
        timestamp: {label: 'Age'},
        e_tx: {label: 'txn', class: 'text-right'},
        gasUsed: {label: 'gasUsed', class: 'text-right'},
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

        let hash = this.$route.params.slug

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/accounts/' + hash + '/mined?' + query)
        self.items = data.items
        self.total = data.total
        self.current_page = data.current_page
        self.pages = data.pages
        self.per_page = data.per_page

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
