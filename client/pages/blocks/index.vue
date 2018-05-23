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
						<div v-if="key === 'number'">
							<nuxt-link :to="{name: 'blocks-slug', params: {slug: item.number}}">{{ item.number }}</nuxt-link>
						</div>

						<div v-if="key === 'timestamp'">
							<span :id="'timestamp__' + index">{{ $moment(item.timestamp).fromNow() }}</span>
							<b-tooltip :target="'timestamp__' + index">
								{{ $moment(item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
							</b-tooltip>
						</div>

						<div v-if="key === 'e_tx'">{{ item.e_tx }}</div>

						<div v-if="key === 'miner'">
							<div class="address__tag">
								<nuxt-link :to="{name: 'address-slug', params: {slug: item.signer}}">
									<span v-if="item.signer">{{ item.signer }}</span>
									<span v-else>{{ item.miner }}</span>
								</nuxt-link>
							</div>
						</div>

						<div v-if="key === 'gasUsed'" class="text-right">
							<div>{{ formatNumber(item.gasUsed) }}</div>
							<small>({{ formatNumber(100 * item.gasUsed / item.gasLimit) }} %)</small>
						</div>

						<div v-if="key === 'gasLimit'">{{ formatNumber(item.gasLimit) }}</div>
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
    head: () => ({
      title: 'Blocks',
    }),
    data: () => ({
      fields: {
        number: {label: 'Number'},
        timestamp: {label: 'Age'},
        e_tx: {label: 'txn'},
        miner: {label: 'Miner'},
        gasUsed: {label: 'GasUsed', tdClass: 'text-right'},
        gasLimit: {label: 'GasLimit'},
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
      this.$store.commit('breadcrumb/setItems', {name: 'blocks', to: {name: 'blocks'}})

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
        let {data} = await this.$axios.get('/api/blocks' + '?' + query)
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
	/* Landscape phones and portrait tablets */
	@media (min-width: 768px) {
		.tm__table_cell {
			min-height: 108px;
		}
	}
</style>
