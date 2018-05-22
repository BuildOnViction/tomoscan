<template>
	<section>
		<p class="tm__total">Total {{ formatNumber(total) }} items found</p>

		<b-table class="tm__table"
			foot-clone
			:fields="fields"
			:loading="loading"
			:items="items">
			<template slot="rank" slot-scope="props">
				{{ props.item.rank }}
			</template>
			<template slot="hash" slot-scope="props">
				<nuxt-link :to="{name: 'address-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
			</template>
			<template slot="balance" slot-scope="props">
				<span v-html="formatUnit(toEther(props.item.balance))"></span>
			</template>
			<template slot="transactionCount" slot-scope="props">
				{{ formatNumber(props.item.transactionCount) }}
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
        balance: {label: 'Balance', tdClass: 'text-right', thClass: 'text-center'},
        transactionCount: {label: 'TxCount', tdClass: 'text-right', thClass: 'text-center'},
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
