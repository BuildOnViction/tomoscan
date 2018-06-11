<template>
	<div
    v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
	<section v-else>

    <div
      v-if="total == 0"
      class="tomo-empty">
        <i class="fa fa-user-secret tomo-empty__icon"></i>
        <p class="tomo-empty__description">No holder found</p>
    </div>

		<p
      v-if="total > 0"
      class="tomo-total-items">Total {{ _nFormatNumber('holder', 'holders', total) }} found</p>

		<table-base
      v-if="total > 0"
			:fields="fields"
			:items="items"
      class="tomo-table--holders">
			<template slot="hash" slot-scope="props">
				<nuxt-link
          class="text-truncate"
          :to="{name: 'address-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
			</template>

			<template slot="quantity" slot-scope="props">{{ toEther(convertHexToFloat(props.item.quantity, 16)) }}</template>
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
	import ReadMore from '~/components/ReadMore'

  export default {
    components: {
      TableBase,
			ReadMore
    },
    mixins: [mixin],
    props: {
      address: {type: String, default: null},
    },
    data: () => ({
      fields: {
        rank: {label: 'Rank'},
        hash: {label: 'Address'},
        quantity: {label: 'Quantity'},
        percentAge: {label: 'Percentage'},
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

      // Show loading.
      self.loading = true

      this.getDataFromApi()
    },
    methods: {
      async getDataFromApi () {
        let self = this

        let params = {
          page: self.currentPage,
          limit: self.perPage,
        }

        this.$router.replace({query: params})

        if (self.address) {
          params.address = self.address
        }

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/token-holders' + '?' + query)
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
