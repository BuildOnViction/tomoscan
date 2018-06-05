<template>
	<div
    v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
	<section v-else>
    <div
      v-if="items.length == 0"
      class="tomo-empty">
        <i class="fa fa-file-text-o tomo-empty__icon"></i>
        <p class="tomo-empty__description">No contract found</p>
    </div>

    <p
      v-if="items.length > 0"
      class="tomo-total-items">Total {{ formatNumber(total) }} contracts found</p>

    <table-base
      v-if="items.length > 0"
      :fields="fields"
      :items="items"
      class="tomo-table--contracts">

      <template slot="hash" slot-scope="props">
        <nuxt-link :to="{name: 'address-slug', params: {slug: props.item.hash}}">
          <span class="d-lg-none d-xl-none">{{ formatLongString(props.item.hash, 16) }}</span>
          <span class="d-none d-lg-block d-xl-none">{{ formatLongString(props.item.hash, 30) }}</span>
          <span class="d-none d-xl-block">{{ formatLongString(props.item.hash, -1) }}</span>
        </nuxt-link>
      </template>

      <template slot="contractName" slot-scope="props">{{ props.item.contractName }}</template>
      
      <template slot="compiler" slot-scope="props">
        <span>{{ props.item.compiler }}</span>
      </template>

      <template slot="balance" slot-scope="props">
        <span>{{ formatUnit(toEther(props.item.balance)) }}</span>
      </template>

      <template slot="txCount" slot-scope="props">
        <span>{{ formatNumber(props.item.txCount) }}</span>
      </template>

      <template slot="dateVerified" slot-scope="props">
        <span>{{ props.item.createdAt }}</span>
      </template>
    </table-base>

		<b-pagination
      v-if="items.length > 0"
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
    components: {
      TableBase,
    },
    mixins: [mixin],
    data () {
      return {
        fields: {
          hash: {label: 'Address'},
          contractName: {label: 'ContractName'},
          compiler: {label: 'Compiler'},
          balance: {label: 'Balance'},
          txCount: {label: 'txCount'},
          createdAt: {label: 'DateVerified'},
        },
        loading: true,
        pagination: {},
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 15,
        pages: 1,
      }
    },
    mounted () {
      let self = this
      // Init breadcrumbs data.
      self.$store.commit('breadcrumb/setItems', {name: 'contracts', to: {name: 'contracts'}})

      self.getDataFromApi()
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

        if (self.address) {
          params.address = self.address
        }

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/contracts' + '?' + query)
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