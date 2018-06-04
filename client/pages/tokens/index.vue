<template>
  <div
    v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
	<section v-else>

    <div
      v-if="items.length == 0"
      class="tomo-empty">
        <i class="fa fa-chain-broken tomo-empty__icon"></i>
        <p class="tomo-empty__description">No token found</p>
    </div>

		<p
      v-if="items.length > 0"
      class="tomo-total-items">Total {{ formatNumber(total) }} tokens found</p>

		<table-base
      v-if="items.length > 0"
			:fields="fields"
			:items="items"
      class="tomo-table--tokens">

			<template slot="hash" slot-scope="props">
				<nuxt-link class="address__tag" :to="{name: 'tokens-slug', params: {slug: props.item.hash}}">
          <span class="d-lg-none d-xl-none">{{ formatLongString(props.item.hash, 16) }}</span>
          <span class="d-none d-lg-block d-xl-none">{{ formatLongString(props.item.hash, 30) }}</span>
          <span class="d-none d-xl-block">{{ formatLongString(props.item.hash) }}</span>
        </nuxt-link>
			</template>

			<template slot="name" slot-scope="props">
				<nuxt-link :to="{name: 'tokens-slug', params: {slug: props.item.hash}}">
					{{ trimWord(props.item.name) }}
				</nuxt-link>
			</template>

			<template slot="symbol" slot-scope="props">{{ props.item.symbol }}</template>

			<template slot="totalSupply" slot-scope="props">{{ formatNumber(props.item.totalSupply, 10) }} {{ props.item.symbol }}</template>

			<template slot="totalSupply" slot-scope="props">{{ formatNumber(props.item.totalSupply) }} {{ props.item.symbol }}</template>
		</table-base>

		<b-pagination
      v-if="items.length > 0"
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
        name: {label: 'Name'},
        symbol: {label: 'Symbol'},
        totalSupply: {label: 'Total Supply'},
        decimals: {label: 'Decimals'},
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