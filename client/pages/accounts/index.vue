<template>
	<div
    v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
	<section v-else>
    <div
      v-if="items.length == 0"
      class="tomo-empty">
        <i class="fa fa-user-secret tomo-empty__icon"></i>
        <p class="tomo-empty__description">No account found</p>
    </div>

		<p
      v-if="items.length > 0"
      class="tomo-total-items">Total {{ formatNumber(total) }} accounts found</p>

    <table-base
      v-if="items.length > 0"
      :fields="fields"
      :items="items"
      class="tomo-table--accounts">
      
      <template slot="rank" slot-scope="props">{{props.item.rank}}</template>

      <template slot="hash" slot-scope="props">
        <nuxt-link
           class="text-truncate"
          :to="{name: 'address-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
      </template>

      <template slot="balance" slot-scope="props">
        <span class="d-lg-none" v-html="formatUnit(toEther(props.item.balance, 5))"></span>
        <span class="d-none d-lg-block" v-html="formatUnit(toEther(props.item.balance))"></span>
      </template>

      <template slot="txCount" slot-scope="props">
        <span>{{ formatNumber(props.item.transactionCount) }}</span>
      </template>
    </table-base>

		<b-pagination
      v-if="items.length > 0"
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
  import axios from '~/plugins/axios'
  import mixin from '~/plugins/mixin'
  import TableBase from '~/components/TableBase'

  export default {
    components: {
      TableBase,
    },
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
