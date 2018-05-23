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
						<div v-if="key === 'transactionHash'">
							<nuxt-link class="address__tag" :to="{name: 'txs-slug', params: {slug: item.transactionHash}}">{{ item.transactionHash }}</nuxt-link>
						</div>

						<div v-if="key === 'block'">
							<nuxt-link v-if="item.block" class="address__tag" :to="{name: 'blocks-slug', params: {slug: item.blockNumber}}">{{ item.blockNumber }}</nuxt-link>
							<span v-else class="text-muted">Pending...</span>
						</div>

						<div v-if="key === 'timestamp'">
							<div v-if="item.timestamp">
								<span :id="'age__' + index">{{ $moment(item.timestamp).fromNow() }}</span>
								<b-tooltip :target="'age__' + index">
									{{ $moment(item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
								</b-tooltip>
							</div>
						</div>

						<div v-if="key === 'from'">
							<div class="address__tag">
								<i v-if="item.from_model && item.from_model.isContract" class="tm tm-icon-contract pull-left mr-1"></i>
								<span v-if="address == item.from">{{ item.from }}</span>
								<nuxt-link v-else :to="{name: 'address-slug', params: {slug: item.from}}">{{ item.from }}</nuxt-link>
							</div>
						</div>

						<div v-if="key === 'arrow'">
							<i class="tm-arrow-right" :class="item.from == address ? 'text-danger' : 'text-success'"></i>
						</div>

						<div v-if="key === 'to'">
							<div class="address__tag">
								<i v-if="item.to_model && item.to_model.isContract" class="tm tm-icon-contract pull-left mr-1"></i>
								<span v-if="address == item.to">{{ item.to }}</span>
								<nuxt-link v-else :to="{name: 'address-slug', params:{slug: item.to}}">
									<span>{{ item.to }}</span>
								</nuxt-link>
							</div>
						</div>

						<div v-if="key === 'token'">
							<nuxt-link v-if="item.symbol" :to="{name: 'tokens-slug', params: {slug: item.address}}">ERC20 ({{ item.symbol }})</nuxt-link>
							<i v-else>ERC20</i>
						</div>

						<div v-if="key === 'value'" class="text-right">{{ formatUnit(toEther(item.value), item.symbol) }}</div>
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
        transactionHash: {label: 'TxHash'},
        timestamp: {label: 'LastSeen'},
        from: {label: 'from'},
        arrow: {class: 'text-center'},
        to: {label: 'To'},
        value: {label: 'Value'},
        token: {label: 'Token'},
      },
      loading: true,
      pagination: {},
      total: 0,
      items: [],
      currentPage: 1,
      perPage: 15,
      pages: 1,
      address: null,
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
          page: self.currentPage,
          limit: self.perPage,
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
        self.currentPage = data.currentPage
        self.pages = data.pages

        // Hide loading.
        self.loading = false

        // Format data.
        self.items = self.formatData(self.items)

        return data
      },
      formatData (items = []) {
        let _items = []
        items.forEach((item) => {
          let _item = item

          // Format for timestamp.
          if (!item.block) {
            _item.timestamp = item.createdAt
          }
          else {
            _item.timestamp = item.block.timestamp
          }

          _items.push(_item)
        })

        return _items
      },
      onChangePaginate (page) {
        let self = this
        self.currentPage = page

        self.getDataFromApi()
      },
    },
  }
</script>
