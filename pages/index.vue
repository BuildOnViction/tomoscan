<template>
	<section class="container">
		<ul>
			<li>
				<nuxt-link to="/blocks">Blocks</nuxt-link>
			</li>
		</ul>
	</section>
</template>

<script>
  import axios from '~/plugins/axios'

  export default {
    beforeCreate () {

    },
//    async asyncData () {
////      let {data} = await axios.get('/api/users')
//      return {users: null}
//    },
    head () {
      return {
        title: 'Explorer',
      }
    },
  }
</script>

<style scoped>
	.title {
		margin: 30px 0;
	}
</style>
