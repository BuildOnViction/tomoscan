<template>
  <div v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
	<section v-else>
		<p class="tomo-total-items">Total {{ formatNumber(total) }} items found</p>

		<table-base
		:fields="fields"
		:items="items"
    class="tomo-table--blocks">
			<template slot="number" slot-scope="props">
				<nuxt-link :to="{name: 'blocks-slug', params: {slug: props.item.number}}">{{ props.item.number }}</nuxt-link>
			</template>

			<template slot="timestamp" slot-scope="props">
				<span :id="'timestamp__' + props.index">{{ $moment(props.item.timestamp).fromNow() }}</span>
				<b-tooltip :target="'timestamp__' + props.index">
					{{ $moment(props.item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
				</b-tooltip>
			</template>

			<template slot="e_tx" slot-scope="props">
        <nuxt-link :to="`/txs?block=${props.item.number}`">{{ props.item.e_tx }}</nuxt-link>
      </template>

			<template slot="miner" slot-scope="props">
        <nuxt-link :to="{name: 'address-slug', params: {slug: props.item.signer}}">
          <span class="d-xl-none" v-if="props.item.signer">{{ formatLongString(props.item.signer, 16) }}</span>
          <span class="d-xl-none" v-else>{{ formatLongString(props.item.miner, 16) }}</span>
          <span class="d-none d-xl-block" v-if="props.item.signer">{{ formatLongString(props.item.signer, 20) }}</span>
          <span class="d-none d-xl-block" v-else>{{ formatLongString(props.item.miner, 20) }}</span>
        </nuxt-link>
			</template>

			<template slot="gasUsed" slot-scope="props">
				<p><span>{{ formatNumber(props.item.gasUsed) }}</span>
				<small>({{ (100 * props.item.gasUsed / props.item.gasLimit).toFixed(2) }} %)</small>
        </p>
			</template>

			<template slot="gasLimit" slot-scope="props">{{ formatNumber(props.item.gasLimit) }}</template>
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
    components: {
      TableBase,
    },
    mixins: [mixin],
    head: () => ({
      title: 'Blocks',
    }),
    data: () => ({
      fields: {
        number: {label: 'Height', cssClass: 'td-height'},
        timestamp: {label: 'Age', cssClass: 'td-age'},
        e_tx: {label: 'txn', cssClass: 'td-txn'},
        miner: {label: 'Miner', cssClass: 'td-miner'},
        gasUsed: {label: 'GasUsed', cssClass: 'td-gas-used'},
        gasLimit: {label: 'GasLimit', cssClass: 'td-gas-limit'},
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
