<template>
	<span>
		<span v-if="text !== null">{{ text }}</span>
		<i v-else class="fa fa-spinner fa-pulse"></i>
	</span>
</template>
<script>
  export default {
    props: ['text'],
  }
</script>