<template>
	<section>
		<p class="tm__total">Total {{ formatNumber(total) }} items found</p>

		<table-base
			:fields="fields"
			:items="items">
			<template slot="hash" slot-scope="props">
				<nuxt-link class="address__tag" :to="{name: 'txs-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
			</template>

			<template slot="block" slot-scope="props">
				<nuxt-link v-if="props.item.block" class="address__tag" :to="{name: 'blocks-slug', params: {slug: props.item.blockNumber}}">{{ props.item.blockNumber }}</nuxt-link>
				<span v-else class="text-muted">Pending...</span>
			</template>

			<template slot="timestamp" slot-scope="props">
				<span :id="'age__' + props.index">{{ $moment(props.item.timestamp).fromNow() }}</span>
				<b-tooltip :target="'age__' + props.index">
					{{ $moment(props.item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
				</b-tooltip>
			</template>

			<template slot="gas" slot-scope="props">{{ formatNumber(props.item.gas) }}</template>

			<template slot="from" slot-scope="props">
				<i v-if="props.item.from_model && props.item.from_model.isContract" class="tm tm-icon-contract mr-1"></i>
				<div class="address__tag">
					<span v-if="address == props.item.from">{{ props.item.from }}</span>
					<nuxt-link v-else :to="{name: 'address-slug', params: {slug: props.item.from}}">{{ props.item.from }}</nuxt-link>
				</div>
			</template>

			<template slot="arrow" slot-scope="props">
				<i class="tm-arrow-right" :class="props.item.from == address ? 'text-danger' : 'text-success'"></i>
			</template>

			<template slot="to" slot-scope="props">
				<div v-if="props.item.to">
					<i v-if="props.item.to_model && props.item.to_model.isContract" class="tm tm-icon-contract mr-1"></i>
					<div v-if="address == props.item.to" class="address__tag">{{ props.item.to }}</div>
					<nuxt-link v-else :to="{name: 'address-slug', params:{slug: props.item.to}}" class="address__tag">
						<span>{{ props.item.to }}</span>
					</nuxt-link>
				</div>
				<div v-else>
					<i class="fa fa-table mr-1"></i>
					<span>Contract Creation</span>
				</div>
			</template>

			<template slot="value" slot-scope="props">{{ formatUnit(toEther(props.item.value)) }}</template>

			<template slot="txFee" slot-scope="props">{{ formatUnit(toEther(props.item.gasPrice * props.item.gas)) }}</template>
		</table-base>

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
  import TableBase from '~/components/TableBase'

  export default {
    mixins: [mixin],
    components: {
      TableBase,
    },
    head () {
      return {
        title: this.isPending() ? 'Transactions Pending' : 'Transactions',
      }
    },
    props: {
      address: {type: String, default: null},
      type: {type: String},
      block: String,
    },
    data: () => ({
      fields: {},
      fields_basic: {
        hash: {label: 'TxHash'},
        block: {label: 'Block'},
        timestamp: {label: 'Age', sortable: false},
        from: {label: 'from'},
        arrow: {label: 'Arrow'},
        to: {label: 'To'},
        value: {label: 'Value', tdClass: 'text-right'},
        txFee: {label: 'TxFee', tdClass: 'text-right'},
      },
      fields_pending: {
        hash: {label: 'TxHash'},
        timestamp: {label: 'LastSeen'},
        gas: {label: 'gasLimit', thClass: 'text-center', tdClass: 'text-right'},
        from: {label: 'from'},
        arrow: {label: 'Arrow'},
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
      blockNumber: null,
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
      if (self.block) {
        self.blockNumber = self.block
      }
      if (query.block) {
        self.blockNumber = query.block
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
        if (self.blockNumber) {
          params.block = self.blockNumber
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