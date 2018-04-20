<template>
	<b-navbar-nav class="ml-auto">
		<b-form-input v-model="search" size="sm" class="mr-sm-2" type="text" placeholder="Search Address / TX / Block" v-on:keyup.enter="onGotoRoute"/>
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
        let search = this.search
        let regexpTx = /[0-9a-zA-Z]{66}?/
        let regexpAddr = /^(0x)?[0-9a-f]{40}$/
        let regexpBlock = /[0-9]+?/
        let to = null

        if (regexpTx.test(search)) {
          to = {name: 'txs-slug', params: {slug: search}}
        }
        else if (regexpAddr.test(search)) {
          to = {name: 'address-slug', params: {slug: search}}
        }
        else if (regexpBlock.test(search)) {
          to = {name: 'blocks-slug', params: {slug: search}}
        }

        console.log(to)

        if (!to) {
          return false
        }

        return this.$router.push(to)
      },
    },
  }
</script>