<template>
  <div
    v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
	<section v-else>

    <div
      v-if="items.length == 0"
      class="tomo-empty">
        <i class="fa fa-exchange tomo-empty__icon"></i>
        <p class="tomo-empty__description">No transaction found</p>
    </div>

		<p
      v-if="items.length > 0"
      class="tomo-total-items">Total {{ formatNumber(total) }} items found</p>

		<table-base
      v-if="items.length > 0"
			:fields="fields"
			:items="items"
      class="tomo-table--token-tx">
			<template slot="transactionHash" slot-scope="props">
				<nuxt-link :to="{name: 'txs-slug', params: {slug: props.item.transactionHash}}">
          <span class="d-none d-sm-block d-md-none d-lg-none">{{ formatLongString(props.item.transactionHash, 32) }}</span>
          <span class="d-sm-none d-md-block d-lg-none d-xl-block d-xxl-none">{{ formatLongString(props.item.transactionHash, 16) }}</span>
          <span class="d-none d-lg-block d-xl-none">{{ formatLongString(props.item.transactionHash, 10) }}</span>
          <span class="d-none d-xxl-block">{{ formatLongString(props.item.transactionHash, 20) }}</span>
        </nuxt-link>
			</template>

			<template slot="block" slot-scope="props">
				<nuxt-link v-if="props.item.block" :to="{name: 'blocks-slug', params: {slug: props.item.blockNumber}}">{{ props.item.blockNumber }}</nuxt-link>
				<span v-else class="text-muted">Pending...</span>
			</template>

			<template slot="timestamp" slot-scope="props">
				<div v-if="props.item.timestamp">
					<span :id="'age__' + props.index">{{ $moment(props.item.timestamp).fromNow() }}</span>
					<b-tooltip :target="'age__' + props.index">
						{{ $moment(props.item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
					</b-tooltip>
				</div>
			</template>

			<template slot="from" slot-scope="props">
        <i v-if="props.item.from_model && props.item.from_model.isContract" class="tm tm-icon-contract mr-1"></i>
        <div class="d-none d-sm-inline-block d-md-none">
					<span v-if="address == props.item.from">{{ formatLongString(props.item.from, 32) }}</span>
					<nuxt-link v-else :to="{name: 'address-slug', params: {slug: props.item.from}}">{{ formatLongString(props.item.from, 32) }}</nuxt-link>
				</div>
        <div class="d-sm-none d-md-inline-block d-lg-none d-xl-inline-block d-xxl-none">
					<span v-if="address == props.item.from">{{ formatLongString(props.item.from, 16) }}</span>
					<nuxt-link v-else :to="{name: 'address-slug', params: {slug: props.item.from}}">{{ formatLongString(props.item.from, 16) }}</nuxt-link>
				</div>
        <div class="d-none d-lg-inline-block d-xl-none">
          <span v-if="address == props.item.from">{{ formatLongString(props.item.from, 10) }}</span>
          <nuxt-link v-else :to="{name: 'address-slug', params: {slug: props.item.from}}">{{ formatLongString(props.item.from, 10) }}</nuxt-link>
        </div>
        <div class="d-none d-xxl-inline-block">
          <span v-if="address == props.item.from">{{ formatLongString(props.item.from, 20) }}</span>
          <nuxt-link v-else :to="{name: 'address-slug', params: {slug: props.item.from}}">{{ formatLongString(props.item.from, 20) }}</nuxt-link>
        </div>
			</template>

			<template slot="arrow" slot-scope="props">
				<i class="tm-arrow-right" :class="props.item.from == address ? 'text-danger' : 'text-success'"></i>
			</template>

			<template slot="to" slot-scope="props">
				<div>
					<i v-if="props.item.to_model && props.item.to_model.isContract" class="tm tm-icon-contract mr-1"></i>
          <div class="d-none d-sm-inline-block d-md-none">
            <span v-if="address == props.item.to">{{ formatLongString(props.item.to, 32) }}</span>
            <nuxt-link v-else :to="{name: 'address-slug', params:{slug: props.item.to}}">
              <span>{{ formatLongString(props.item.to, 32) }}</span>
            </nuxt-link>
          </div>
          <div class="d-sm-none d-md-inline-block d-lg-none d-xl-inline-block d-xxl-none">
            <span v-if="address == props.item.to">{{ formatLongString(props.item.to, 16) }}</span>
            <nuxt-link v-else :to="{name: 'address-slug', params:{slug: props.item.to}}">
              <span>{{ formatLongString(props.item.to, 16) }}</span>
            </nuxt-link>
          </div>
          <div class="d-none d-lg-inline-block d-xl-none">
            <span v-if="address == props.item.to">{{ formatLongString(props.item.to, 10) }}</span>
            <nuxt-link v-else :to="{name: 'address-slug', params:{slug: props.item.to}}">
              <span>{{ formatLongString(props.item.to, 10) }}</span>
            </nuxt-link>
          </div>
          <div class="d-none d-xxl-inline-block">
            <span v-if="address == props.item.to">{{ formatLongString(props.item.to, 20) }}</span>
            <nuxt-link v-else :to="{name: 'address-slug', params:{slug: props.item.to}}">
              <span>{{ formatLongString(props.item.to, 20) }}</span>
            </nuxt-link>
          </div>
				</div>
			</template>

      <template slot="value" slot-scope="props">{{ formatUnit(toEther(props.item.value), props.item.symbol) }}</template>

			<template slot="token" slot-scope="props">
				<nuxt-link v-if="props.item.symbol" :to="{name: 'tokens-slug', params: {slug: props.item.address}}">ERC20 ({{ props.item.symbol }})</nuxt-link>
				<i v-else>ERC20</i>
			</template>
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
    props: {
      token: {type: String, default: null},
    },
    data: () => ({
      fields: {
        transactionHash: {label: 'TxHash'},
        timestamp: {label: 'LastSeen'},
        from: {label: 'From'},
        arrow: {class: 'text-center'},
        to: {label: 'To'},
        value: {label: 'Value', tdClass: 'text-right'},
        token: {label: 'Token', tdClass: 'text-right'},
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
