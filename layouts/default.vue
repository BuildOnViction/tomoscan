<template>
	<div>
		<b-navbar toggleable="md" type="dark" variant="primary">
			<b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
			<b-navbar-brand :to="{name: 'index'}">TOMO Explorer</b-navbar-brand>

			<b-collapse is-nav id="nav_collapse">
				<b-navbar-nav>
					<b-nav-item :to="{name: 'blocks'}">Blocks</b-nav-item>
					<b-nav-item-dropdown text="Transactions">
						<b-dropdown-item :to="{name: 'txs'}">All Transactions</b-dropdown-item>
						<b-dropdown-item :to="{name: 'txs-pending'}">Transactions Pending</b-dropdown-item>
					</b-nav-item-dropdown>
					<b-nav-item :to="{name: 'accounts'}">Accounts</b-nav-item>
				</b-navbar-nav>
				<b-navbar-nav class="ml-auto">
					<b-nav-form>
						<b-form-input size="sm" class="mr-sm-2" type="text" placeholder="Search"/>
						<b-button size="sm" class="my-2 my-sm-0" type="submit">Search</b-button>
					</b-nav-form>
				</b-navbar-nav>
			</b-collapse>
		</b-navbar>

		<main>
			<b-container>
				<nuxt/>
			</b-container>
		</main>
	</div>
</template>

<script>
  import MyFooter from '~/components/Footer.vue'
  import Search from '~/components/Search.vue'

  export default {
    components: {
      MyFooter,
      Search,
    },
  }
</script>

<style>
	.address__tag {
		display: inline-block;
		width: 132px;
		white-space: nowrap;
		overflow: hidden !important;
		text-overflow: ellipsis;
	}

	main, footer {
		margin-top: 35px;
	}
</style>
