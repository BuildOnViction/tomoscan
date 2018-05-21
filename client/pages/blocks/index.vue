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
				<nuxt-link :to="{name: 'txs', query: {block: props.item.number}}">{{ props.item.e_tx }}</nuxt-link>
			</template>
			<template slot="uncles" slot-scope="props">
				{{ props.item.uncles.length }}
			</template>
			<template slot="miner" slot-scope="props">
				<div class="address__tag">
					<nuxt-link :to="{name: 'address-slug', params: {slug: props.item.signer}}">
						<span v-if="props.item.signer">{{ props.item.signer }}</span>
						<span v-else>{{ props.item.miner }}</span>
					</nuxt-link>
				</div>
			</template>
			<template slot="gasUsed" slot-scope="props">
				<div>{{ formatNumber(props.item.gasUsed) }}</div>
				<small>({{ formatNumber(100 * props.item.gasUsed / props.item.gasLimit) }} %)</small>
			</template>
			<template slot="gasLimit" slot-scope="props">
				{{ formatNumber(props.item.gasLimit) }}
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
        uncles: {label: 'Uncles'},
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

<style scoped>
</style>
