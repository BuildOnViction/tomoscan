<template>
	<section>
		<p class="tm__total">Total {{ formatNumber(total) }} items found</p>

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
						<div v-if="key === 'block'">
							<nuxt-link :to="{name: 'blocks-slug', params: {slug: item.number}}">{{ item.number }}</nuxt-link>
						</div>

						<div v-if="item.timestamp">
							<span :id="'age__' + index">{{ $moment(item.timestamp).fromNow() }}</span>
							<b-tooltip :target="'age__' + index">
								{{ $moment(item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
							</b-tooltip>
						</div>

						<div v-if="key === 'e_tx'">{{ item.e_tx }}</div>

						<div v-if="key === 'gasUsed'">{{ item.gasUsed }}</div>
					</div>
				</div>
			</div>
		</div>

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
