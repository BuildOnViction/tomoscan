<template>
  <div
    v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
	<section v-else>
    
    <div
      v-if="total == 0"
      class="tomo-empty">
        <i class="fa fa-exchange tomo-empty__icon"></i>
        <p class="tomo-empty__description">No transaction found</p>
    </div>

		<p
      v-if="total > 0"
      class="tomo-total-items">
      Total {{ _nFormatNumber('transaction', 'transactions', total) }} found
    </p>

		<table-base
      v-if="total > 0"
			:fields="fields"
			:items="items"
      class="tomo-table--transactions">
			<template slot="hash" slot-scope="props">
				<nuxt-link 
          class="text-truncate"
          :to="{name: 'txs-slug', params: {slug: props.item.hash}}">
          <i v-if="!props.item.status" class="fa fa-exclamation mr-1 text-danger tx-failed"></i>
          {{ props.item.hash }}</nuxt-link>
			</template>

			<template slot="block" slot-scope="props">
				<nuxt-link v-if="props.item.block" :to="{name: 'blocks-slug', params: {slug: props.item.blockNumber}}">{{ props.item.blockNumber }}</nuxt-link>
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
				<i
          v-if="props.item.from_model && props.item.from_model.isContract"
          class="tm tm-icon-contract mr-1 mr-lg-2" />
        <span
          v-if="address == props.item.from"
          class="text-truncate">{{ props.item.from }}</span>
        <nuxt-link
          v-else
          :to="{name: 'address-slug', params: {slug: props.item.from}}"
          class="text-truncate">{{ props.item.from }}</nuxt-link>
			</template>

			<template slot="arrow" slot-scope="props">
				<i class="tm-arrow-right" :class="props.item.from == address ? 'text-danger' : 'text-success'"></i>
			</template>

			<template slot="to" slot-scope="props">
				<div v-if="props.item.to">
          <i
            v-if="props.item.to_model && props.item.to_model.isContract"
            class="tm tm-icon-contract mr-1 mr-lg-2" />
          <span
            v-if="address == props.item.to"
            class="text-truncate">{{ props.item.to }}</span>
          <nuxt-link
            v-else
            :to="{name: 'address-slug', params:{slug: props.item.to}}"
            class="text-truncate">{{ props.item.to }}</nuxt-link>
        </div>
        <div
          v-else
          class="contract-creation">
          <span>Contract Creation</span>
        </div>
			</template>

			<template slot="value" slot-scope="props">{{ formatUnit(toEther(props.item.value)) }}</template>

			<template slot="txFee" slot-scope="props">{{ formatUnit(toEther(props.item.gasPrice * props.item.gas)) }}</template>
		</table-base>

		<b-pagination
      v-if="total > 0 && total > perPage"
      v-model="currentPage"
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
      page: {default: null}
    },
    data: () => ({
      fields: {},
      fields_basic: {
        hash: {label: 'TxHash'},
        block: {label: 'Block'},
        timestamp: {label: 'Age'},
        from: {label: 'From'},
        arrow: {label: ''},
        to: {label: 'To'},
        value: {label: 'Value', cssClass: 'pr-lg-4'},
        txFee: {label: 'TxFee'},
      },
      fields_pending: {
        hash: {label: 'TxHash'},
        timestamp: {label: 'LastSeen'},
        gas: {label: 'gasLimit'},
        from: {label: 'From'},
        arrow: {label: ''},
        to: {label: 'To'},
        value: {label: 'Value'},
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
        self.total = data.total
        self.currentPage = data.currentPage
        self.pages = data.pages

        if (data.items.length == 0) {
            self.loading = false
        }

        if (self.page) {
          self.page.txsCount = self.total
        }
        
        data.items.forEach(async (item, index, array) => {
          if (typeof item.status === 'undefined') {
            let status = await self.$axios.get(`/api/txs/status/${item.hash}`)
            item.status = status.data
          }

          if (index == array.length - 1) {
            self.items = array

            // Format data.
            self.items = self.formatData(self.items)

            // Hide loading.
            self.loading = false
          }
        })

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