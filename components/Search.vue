<template>
	<v-menu
		bottom
		offset-y
		:close-on-content-click="true"
	>
		<v-text-field
			flat
			prepend-icon="search"
			placeholder="Tx Hash, Address, or Block #"
			@input="onSearchChange"
			slot="activator"
		></v-text-field>
		<v-card>
			<v-list v-for="item in items" :key="item.title">
				<v-list-tile avatar :key="item.title" @click="onGotoRoute(item.route)">
					<v-list-tile-content>
						<v-list-tile-title v-html="item.title"></v-list-tile-title>
						<v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
					</v-list-tile-content>
				</v-list-tile>
			</v-list>
		</v-card>
	</v-menu>
</template>
<script>
  export default {
    data: () => ({
      items: [],
      loading: false,
      search: null,
    }),
    methods: {
      onGotoRoute (to) {
        return this.$router.push(to)
      },
      onSearchChange (search) {
        let self = this
        self.loading = true
        if (search !== undefined) {
          let regexpTx = /[0-9a-zA-Z]{64}?/
          let regexpAddr = /^(0x)?[0-9a-f]{40}$/
          let regexpBlock = /[0-9]{1,7}?/

          if (regexpTx.test(search)) {
            self.items = [
              {
                title: search,
                subtitle: 'Transaction',
                route: {name: 'txs-slug', params: {slug: search}},
              }]
          }
          else if (regexpAddr.test(search)) {
            self.items = [
              {
                title: search,
                subtitle: 'Address',
                route: {name: 'address-slug', params: {slug: search}},
              }]
          }
          else if (regexpBlock.test(search)) {
            self.items = [
              {
                title: search,
                subtitle: 'Block',
                route: {name: 'blocks-slug', params: {slug: search}},
              }]
          }
          else {
            self.items = []
          }
        }

        self.loading = false
      },
    },
  }
</script>