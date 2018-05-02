<template>
	<section>
		<b-table
			striped
			responsive
			foot-clone
			small
			:fields="fields"
			:loading="loading"
			:items="items">
			<template slot="transactionHash" slot-scope="props">
				<nuxt-link class="address__tag" :to="{name: 'txs-slug', params: {slug: props.item.transactionHash}}">{{ props.item.transactionHash }}</nuxt-link>
			</template>

			<template slot="block" slot-scope="props">
				<nuxt-link v-if="props.item.block" class="address__tag" :to="{name: 'blocks-slug', params: {slug: props.item.blockNumber}}">{{ props.item.blockNumber }}</nuxt-link>
				<span v-else class="text-muted">Pending...</span>
			</template>

			<template slot="timestamp" slot-scope="props">
				<div v-if="props.item.timestamp">
					<span :id="'age__' + props.index">{{ moment(props.item.timestamp).fromNow() }}</span>
					<b-tooltip :target="'age__' + props.index">
						{{ moment(props.item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
					</b-tooltip>
				</div>
			</template>

			<template slot="from" slot-scope="props">
				<div class="address__tag">
					<i v-if="props.item.from_model && props.item.from_model.isContract" class="fa fa-file-text-o mr-1"></i>
					<span v-if="address == props.item.from">{{ props.item.from }}</span>
					<nuxt-link v-else :to="{name: 'address-slug', params: {slug: props.item.from}}">{{ props.item.from }}</nuxt-link>
				</div>
			</template>

			<template slot="arrow" slot-scope="props">
				<i class="fa fa-arrow-right" :class="props.item.from == address ? 'text-danger' : 'text-success'"></i>
			</template>

			<template slot="to" slot-scope="props">
				<div class="address__tag">
					<i v-if="props.item.to_model && props.item.to_model.isContract" class="fa fa-file-text-o mr-1"></i>
					<span v-if="address == props.item.to">{{ props.item.to }}</span>
					<nuxt-link v-else :to="{name: 'address-slug', params:{slug: props.item.to}}">
						<span>{{ props.item.to }}</span>
					</nuxt-link>
				</div>
			</template>

			<template slot="value" slot-scope="props">
				{{ toEther(props.item.value) }}
			</template>

			<template slot="token" slot-scope="props">
				<nuxt-link :to="{name: 'tokens-slug', params: {slug: props.item.address}}">ERC20 ({{ props.item.symbol }})</nuxt-link>
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
        transactionHash: {label: 'TxHash'},
        timestamp: {label: 'LastSeen'},
        from: {label: 'from'},
        arrow: {class: 'text-center'},
        to: {label: 'To'},
        value: {label: 'Value', class: 'text-right'},
        token: {label: 'Token'},
      },
      loading: true,
      pagination: {},
      total: 0,
      items: [],
      current_page: 1,
      per_page: 15,
      pages: 1,
      address: null,
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

      if (query.address) {
        self.address = query.address
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

        if (self.token) {
          params.token = self.token
        }
        if (self.address) {
          params.address = self.address
        }

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/token-txs' + '?' + query)
        self.items = data.items
        self.total = data.total
        self.current_page = data.current_page
        self.pages = data.pages

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
