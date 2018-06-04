<template>
	<table class="tomo-table">
		<thead>
			<tr>
				<th v-for="field in fields" :class="field.cssClass">{{ field.label }}</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="(item, index) in items">
				<td :data-label="field.label" v-for="(field, key) in fields" :class="field.cssClass">
					<slot :name="key" v-bind:item="item" v-bind:index="index">{{ item[key] }}</slot>
				</td>
			</tr>
		</tbody>
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
