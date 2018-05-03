<template>
	<b-navbar-nav class="ml-auto">
		<input type="search" v-model="search" class="form-control form-control-sm" placeholder="Search Address / TX / Block" @keyup.enter="onGotoRoute"/>
		<b-button variant="primary" size="sm" class="my-2 my-sm-0" @click="onGotoRoute"><i class="fa fa-search"></i></b-button>
	</b-navbar-nav>
</template>
<script>
  export default {
    data: () => ({
      loading: false,
      search: null,
    }),
    methods: {
      onGotoRoute () {
        let search = this.search.trim()
        let regexpTx = /[0-9a-zA-Z]{66}?/
        let regexpAddr = /^(0x)?[0-9a-f]{40}$/
        let regexpBlock = /[0-9]+?/
        let to = null

        if (regexpAddr.test(search)) {
          to = {name: 'address-slug', params: {slug: search}}
        }
        else if (regexpTx.test(search)) {
          to = {name: 'txs-slug', params: {slug: search}}
        }
        else if (regexpBlock.test(search)) {
          to = {name: 'blocks-slug', params: {slug: search}}
        }

        if (!to) {
          return false
        }

        return this.$router.push(to)
      },
    },
  }
</script>