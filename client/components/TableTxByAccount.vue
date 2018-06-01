<template>
	<section>
		<p class="tomo-total-items">Total {{ formatNumber(total) }} items found</p>

		<table-base
			:fields="fields"
			:items="items">
			<template slot="block" slot-scope="props">
				<nuxt-link :to="{name: 'blocks-slug', params: {slug: props.item.number}}">{{ props.item.number }}</nuxt-link>
			</template>

			<template slot="timestamp" slot-scope="props">
				<span :id="'age__' + index">{{ $moment(props.item.timestamp).fromNow() }}</span>
				<b-tooltip :target="'age__' + index">
					{{ $moment(props.item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
				</b-tooltip>
			</template>

			<template slot="e_tx" slot-scope="props">{{ props.item.e_tx }}</template>

			<template slot="gasUsed" slot-scope="props">{{ props.item.gasUsed }}</template>
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
    mixins: [mixin],
    components: {
      TableBase,
    },
    props: {
      token: {type: String, default: null},
    },
    data: () => ({
      fields: {
        block: {label: 'Block'},
        timestamp: {label: 'Age'},
        e_tx: {label: 'txn'},
        gasUsed: {label: 'gasUsed'},
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

        let hash = this.$route.params.slug

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/accounts/' + hash + '/mined?' + query)
        self.items = data.items
        self.total = data.total
        self.currentPage = data.currentPage
        self.pages = data.pages
        self.perPage = data.perPage

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
