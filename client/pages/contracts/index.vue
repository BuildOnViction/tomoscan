<template>
	<section>
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
							<nuxt-link :to="{name: 'address-slug', params: {slug: item.hash}}">{{ item.hash }}</nuxt-link>
						</div>
						<div v-if="key === 'txCount'" class="text-right">{{ item.txCount }}</div>
						<div v-else>{{ item[key] }}</div>
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