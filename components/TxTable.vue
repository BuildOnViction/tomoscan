<template>
	<div>
		<b-table
			striped
			responsive
			foot-clone
			small
			:fields="fields"
			:loading="loading"
			:items="items">
			<template slot="hash" slot-scope="props">
				<nuxt-link class="address__tag" :to="{name: 'txs-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
			</template>
			<template slot="block" slot-scope="props">
				<nuxt-link class="address__tag" :to="{name: 'blocks-slug', params: {slug: props.item.blockNumber}}">{{ props.item.blockNumber }}</nuxt-link>
			</template>
			<template slot="age" slot-scope="props">
				<span :id="'age__' + props.index">{{ moment(props.item.block_id.timestamp).fromNow() }}</span>
				<b-tooltip :target="'age__' + props.index">
					{{ moment(props.item.block_id.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
				</b-tooltip>
			</template>
			<template slot="from" slot-scope="props">
				<nuxt-link class="address__tag" :to="{name: 'address-slug', params: {slug: props.item.from}}">{{ props.item.from }}</nuxt-link>
			</template>
			<template slot="arrow" slot-scope="props">
				<i class="fa fa-arrow-right" :class="props.item.from == address ? 'text-danger' : 'text-success'"></i>
			</template>
			<template slot="to" slot-scope="props">
				<div v-if="props.item.contractAddress">
					<i class="fa fa-file-alt"></i>
					<nuxt-link class="address__tag" :to="{name: 'address-slug', params:{slug: props.item.contractAddress}}">{{ props.item.contractAddress }}</nuxt-link>
				</div>
				<div v-else>
					<nuxt-link class="address__tag" :to="{name: 'address-slug', params:{slug: props.item.to}}">{{ props.item.to }}</nuxt-link>
				</div>
			</template>
			<template slot="value" slot-scope="props">
				{{ formatUnit(toEther(props.item.value)) }}
			</template>
			<template slot="txFee" slot-scope="props">
				{{ formatUnit(toEther(props.item.gasPrice * props.item.gas)) }}
			</template>
		</b-table>
		<b-pagination
			align="center"
			:total-rows="total"
			:per-page="per_page"
			@change="onChangePaginate"
		></b-pagination>
	</div>
</template>

<script>
  import mixin from '~/plugins/mixin'

  export default {
    mixins: [mixin],
    head: () => ({
      title: 'Transactions',
    }),
    props: {
      address: {type: String},
      type: {type: String},
    },
    data: () => ({
      fields: {
        hash: {label: 'TxHash'},
        block: {label: 'Block'},
        age: {label: 'Age', sortable: false},
        from: {label: 'from'},
        arrow: {class: 'text-center'},
        to: {label: 'To'},
        value: {label: 'Value', class: 'text-right'},
        txFee: {label: 'TxFee', class: 'text-right'},
      },
      loading: true,
      pagination: {},
      total: 0,
      items: [],
      current_page: 1,
      per_page: 15,
      pages: 1,
      block: null,
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
      if (query.block) {
        self.block = query.block
      }

//      if(! self.isPending()) {
//        self.headers.push({label: 'Block', key: 'block'})
//      }

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
      isPending () {
        return this.type === 'pending' ? true : false
      },
    },
  }
</script>