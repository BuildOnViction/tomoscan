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
						<div v-if="key === 'rank'">{{ item.rank }}</div>

						<div v-else-if="key === 'hash'">
							<nuxt-link :to="{name: 'address-slug', params: {slug: item.hash}}">{{ item.hash }}</nuxt-link>
						</div>

						<div v-else-if="key === 'balance'" class="text-right"><span v-html="formatUnit(toEther(item.balance))"></span></div>

						<div v-else-if="key === 'transactionCount'" class="text-right">{{ formatNumber(item.transactionCount) }}</div>
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
        balance: {label: 'Balance'},
        transactionCount: {label: 'TxCount'},
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
      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'accounts', to: {name: 'accounts'}})

      // Get query data.
      let query = self.$route.query

      if (query.page) {
        self.currentPage = parseInt(query.page)
      }
      if (query.limit) {
        self.perPage = parseInt(query.limit)
      }

      await self.getDataFromApi()
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
        let {data} = await this.$axios.get('/api/accounts' + '?' + query)
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

      linkGen (page_numb) {
        let self = this
        let query = {
          page: page_numb,
          limit: self.perPage,
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
