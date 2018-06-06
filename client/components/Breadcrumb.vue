<template>
	<div>
		<ol class="breadcrumb tomo-breadcrumb">
			<li v-for="item in items" class="breadcrumb-item">
				<nuxt-link :to="item.location" active-class="active">
					{{ formatLongString(item.title, 16) }}
				</nuxt-link>
			</li>
		</ol>
	</div>
</template>
<script>
  import mixin from '~/plugins/mixin'
  export default {
    mixins: [mixin],
    computed: {
      items () {
        return this.$store.state.breadcrumb.items
      },
    },
  }
</script>