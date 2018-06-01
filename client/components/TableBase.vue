<template>
	<table class="tomo-table">
		<tr>
			<th v-for="field in fields" :class="field.thClass">{{ field.label }}</th>
		</tr>
		<tr v-for="(item, index) in items">
			<td :data-label="field.label" v-for="(field, key) in fields">
				<slot :name="key" v-bind:item="item" v-bind:index="index">{{ item[key] }}</slot>
			</td>
		</tr>
	</table>
</template>
<script>
  export default {
    props: {
      fields: Object,
      items: Array,
    },
  }
</script>
<style type="text/scss" lang="scss">
	.d__table {
		display: table;
		width: 100%;
		height: 100%;
	}

	.d__cell {
		display: table-cell;
		vertical-align: middle;
	}
</style>