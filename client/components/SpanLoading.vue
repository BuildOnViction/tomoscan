<template>
	<span v-if="text !== null">{{ text }}</span>
	<i v-else class="tomo-loading"></i>
</template>
<script>
  export default {
    props: ['text', 'title'],
  }
</script>