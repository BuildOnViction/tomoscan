<template>
	<section>
	</section>
</template>

<script>
  import axios from '~/plugins/axios'
  import mixin from '~/plugins/mixin'
  import socket from '~/plugins/socket.io'
  import _ from 'lodash'
  import web3 from 'web3'

  export default {
    mixins: [mixin],
    head () {
      return {
        title: 'TOMO Explorer',
      }
    },
    data: () => ({}),
    beforeMount () {
      let self = this
    },
    mounted () {
      let self = this
    },
    methods: {},
  }
</script>

<style scoped>
</style>
