<template>
	<div class="tm__table">
		<div class="tm__table_heading">
			<div class="row">
				<div class="col" v-for="field in fields">
					{{ field.label }}
				</div>
			</div>
		</div>
		<div class="tm__table_body">
			<div class="row tm__table_row" v-for="(item, index) in items">
				<div class="col tm__table_cell" v-for="(field, key) in fields">
					<div class="d__table">
						<div class="d__cell" :class="field.tdClass">
							<slot :name="key" v-bind:item="item" v-bind:index="index">{{ item[key] }}</slot>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
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
		text-align: center;
	}
</style>