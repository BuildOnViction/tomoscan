<template>
	<div>
		<ol class="breadcrumb">
			<li v-for="item in items" class="breadcrumb-item">
				<nuxt-link :to="item.location" active-class="active">
					{{ item.title }}
				</nuxt-link>
			</li>
		</ol>
	</div>
</template>
<script>
  export default {
    computed: {
      items () {
        return this.$store.state.breadcrumb.items
      },
    },
  }
</script>