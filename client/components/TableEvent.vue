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
			<template slot="label" slot-scope="props">
				<nuxt-link :to="{name: 'txs-slug', params: {slug: props.item.transactionHash}}" class="address__tag">{{ props.item.transactionHash }}...</nuxt-link>
				<div>#
					<nuxt-link :to="{name: 'blocks-slug', params: {slug: props.item.blockNumber}}">{{ props.item.blockNumber }}</nuxt-link>
				</div>
				<div v-if="props.item.block">{{ $moment(props.item.block.timestamp).fromNow() }}</div>
			</template>
			<template slot="method" slot-scope="props">
				<div class="d-block" v-html="props.item.methodName"></div>
				<div class="d-block">[{{ props.item.methodCode }}]</div>
			</template>
			<template slot="logs" slot-scope="props">
				<div v-if="isTransferEvent(props.item.topics[0])">
					<b-link v-b-toggle="'collapse' + props.index">Transfer</b-link>
					(index_topic_1 <span class="text-primary">address</span>&nbsp;<span class="text-danger">from</span>, index_topic_2 <span class="text-primary">address</span>&nbsp;<span class="text-danger">to</span>, <span class="text-primary">uint256</span>&nbsp;<span class="text-danger">value</span>)
				</div>
				<b-collapse :id="'collapse' + props.index" class="mt-2 mb-2">
					<b-card v-if="isTransferEvent(props.item.topics[0])">
						<ul class="list-unstyled">
							<li>
								<p>
									<span class="d-block"><i class="text-muted">address</i> from</span>
									<nuxt-link :to="{name: 'address-slug', params: {slug: unformatAddress(props.item.datas[0])}}">{{ unformatAddress(props.item.datas[0]) }}</nuxt-link>
								</p>
							</li>
							<li>
								<p>
									<span class="d-block"><i class="text-muted">address</i> to</span>
									<nuxt-link :to="{name: 'address-slug', params: {slug: unformatAddress(props.item.datas[1])}}">{{ unformatAddress(props.item.datas[1]) }}</nuxt-link>
								</p>
							</li>
							<li>
								<p>
									<span class="d-block"><i class="text-muted">unit256</i> value</span>
									<span class="d-block">{{ convertHexToInt(props.item.data) }}</span>
								</p>
							</li>
						</ul>
					</b-card>
				</b-collapse>
				<ul class="list-unstyled">
					<li v-for="(topic, i) in props.item.topics">
						<div :class="i === 0 ? 'text-muted': ''">[topic {{ i }}] {{ topic }}</div>
					</li>
					<li>
						<i class="fa fa-arrow-right mr-1"></i>{{ props.item.data }}
					</li>
				</ul>
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
    props: {
      address: {type: String, default: null},
      tx: {type: String, default: null},
    },
    data: () => ({
      fields: {
        label: {label: 'TxHash|Block|Age', tdClass: 'small'},
        method: {label: 'Method', tdClass: 'small'},
        logs: {label: 'Event Logs', tdClass: 'small'},
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

        if (self.address) {
          params.address = self.address
        }
        if (self.tx) {
          params.tx = self.tx
        }

        this.$router.replace({query: params})

        let query = this.serializeQuery(params)
        let {data} = await self.$axios.get('/api/logs?' + query)
        self.items = data.items
        self.total = data.total
        self.currentPage = data.currentPage
        self.pages = data.pages
        if (self.items.length) {
          for (let i = 0; i < self.items.length; i++) {
            self.items[i] = self.formatItem(self.items[i])
          }
        }

        // Hide loading.
        self.loading = false

        return data
      },
      onChangePaginate (page) {
        let self = this
        self.currentPage = page

        self.getDataFromApi()
      },
      formatItem (item) {
        // Parse input data to array.
        let data = item.data
        data = data.replace('0x', '')
        item.datas = data.match(/.{1,64}/g)

        return item
      },
      isTransferEvent: (code) => code === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    },
  }
</script>