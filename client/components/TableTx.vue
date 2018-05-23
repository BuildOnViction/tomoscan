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
						<div v-if="key === 'hash'">
							<nuxt-link class="address__tag" :to="{name: 'txs-slug', params: {slug: item.hash}}">{{ item.hash }}</nuxt-link>
						</div>

						<div v-if="key === 'block'">
							<nuxt-link v-if="item.block" class="address__tag" :to="{name: 'blocks-slug', params: {slug: item.blockNumber}}">{{ item.blockNumber }}</nuxt-link>
							<span v-else class="text-muted">Pending...</span>
						</div>

						<div v-if="key === 'timestamp'">
							<span :id="'age__' + index">{{ $moment(item.timestamp).fromNow() }}</span>
							<b-tooltip :target="'age__' + index">
								{{ $moment(item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
							</b-tooltip>
						</div>

						<div v-if="key === 'gas'">{{ formatNumber(item.gas) }}</div>

						<div v-if="key === 'from'">
							<i v-if="item.from_model && item.from_model.isContract" class="tm tm-icon-contract pull-left mr-1"></i>
							<div class="address__tag">
								<span v-if="address == item.from">{{ item.from }}</span>
								<nuxt-link v-else :to="{name: 'address-slug', params: {slug: item.from}}">{{ item.from }}</nuxt-link>
							</div>
						</div>

						<div v-if="key === 'arrow'">
							<i class="tm-arrow-right" :class="item.from == address ? 'text-danger' : 'text-success'"></i>
						</div>

						<div v-if="key === 'to'">
							<div v-if="item.to">
								<i v-if="item.to_model && item.to_model.isContract" class="tm tm-icon-contract pull-left mr-1"></i>
								<div v-if="address == item.to">{{ item.to }}</div>
								<nuxt-link v-else :to="{name: 'address-slug', params:{slug: item.to}}" class="address__tag">
									<span>{{ item.to }}</span>
								</nuxt-link>
							</div>
							<div v-else>
								<i class="fa fa-table mr-1"></i>
								<span>Contract Creation</span>
							</div>
						</div>

						<div v-if="key === 'value'">{{ formatUnit(toEther(item.value)) }}</div>

						<div v-if="key === 'txFee'">{{ formatUnit(toEther(item.gasPrice * item.gas)) }}</div>
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
    head () {
      return {
        title: this.isPending() ? 'Transactions Pending' : 'Transactions',
      }
    },
    props: {
      address: {type: String, default: null},
      type: {type: String},
    },
    data: () => ({
      fields: {},
      fields_basic: {
        hash: {label: 'TxHash'},
        block: {label: 'Block'},
        timestamp: {label: 'Age', sortable: false},
        from: {label: 'from'},
        arrow: {class: 'text-center'},
        to: {label: 'To'},
        value: {label: 'Value', tdClass: 'text-right'},
        txFee: {label: 'TxFee', tdClass: 'text-right'},
      },
      fields_pending: {
        hash: {label: 'TxHash'},
        timestamp: {label: 'LastSeen'},
        gas: {label: 'gasLimit', thClass: 'text-center', tdClass: 'text-right'},
        from: {label: 'from'},
        arrow: {class: 'text-center'},
        to: {label: 'To'},
        value: {label: 'Value', class: 'text-right'},
      },
      loading: true,
      pagination: {},
      total: 0,
      items: [],
      currentPage: 1,
      perPage: 15,
      pages: 1,
      block: null,
    }),
    async mounted () {
      let self = this
      self.fields = self.isPending() ? self.fields_pending : self.fields_basic

      // Init from router.
      let query = self.$route.query
      if (query.page) {
        self.currentPage = parseInt(query.page)
      }
      if (query.limit) {
        self.perPage = parseInt(query.limit)
      }
      if (query.block) {
        self.block = query.block
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
        if (self.block) {
          params.block = self.block
        }
        if (self.type) {
          params.type = self.type
        }

        this.$router.replace({query: params})

        if (self.address) {
          params.address = self.address
        }

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/txs' + '?' + query)
        self.items = data.items
        self.total = data.total
        self.currentPage = data.currentPage
        self.pages = data.pages

        // Format data.
        self.items = self.formatData(self.items)

        // Hide loading.
        self.loading = false

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
      isPending () {
        return this.type === 'pending' ? true : false
      },
    },
  }
</script>