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
				<nuxt-link v-if="props.item.block" class="address__tag" :to="{name: 'blocks-slug', params: {slug: props.item.blockNumber}}">{{ props.item.blockNumber }}</nuxt-link>
				<span v-else class="text-muted">Pending...</span>
			</template>

			<template slot="age" slot-scope="props">
				<span :id="'age__' + props.index">{{ moment(props.item.timestamp).fromNow() }}</span>
				<b-tooltip :target="'age__' + props.index">
					{{ moment(props.item.timestamp).format('MMM-DD-Y hh:mm:ss A') }}
				</b-tooltip>
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
    head () {
      return {
        title: 'Token (ERC20) Transfers',
      }
    },
    data: () => ({
      fields: {
        hash: {label: 'TxHash'},
        timestamp: {label: 'LastSeen'},
        from: {label: 'from'},
        arrow: {class: 'text-center'},
        to: {label: 'To'},
        value: {label: 'Value', class: 'text-right'},
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
      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'tokentxs', to: {name: 'tokentxs'}})

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

        if (self.address) {
          params.address = self.address
        }

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/tokentxs' + '?' + query)
        self.items = data.items
        self.total = data.total
        self.current_page = data.current_page
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

          _items.push(_item)
        })

        return _items
      },
      onChangePaginate (page) {
        let self = this
        self.current_page = page

        self.getDataFromApi()
      },
    },
  }
</script>

<style scoped>

</style>
