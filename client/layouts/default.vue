<template>
	<section>
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
					<b-nav-item :to="{name: 'tokens'}">Tokens</b-nav-item>
					<b-nav-item :to="{name: 'tokentxs'}">Token Transfers</b-nav-item>
				</b-navbar-nav>
				<search></search>
				<b-navbar-nav v-if="!user">
					<b-nav-item v-b-modal="'loginModal'">Login</b-nav-item>
					<b-nav-item v-b-modal="'registerModal'">Register</b-nav-item>
				</b-navbar-nav>
				<b-navbar-nav v-else>
					<b-nav-item-dropdown right>
						<template slot="button-content">
							<em>{{ user.email }}</em>
						</template>
						<b-dropdown-item :to="{name: 'follows'}">Follow List</b-dropdown-item>
						<b-dropdown-item @click="onLogout">Logout</b-dropdown-item>
					</b-nav-item-dropdown>
				</b-navbar-nav>
			</b-collapse>
		</b-navbar>

		<main>
			<b-container>
				<breadcrumb/>
				<nuxt/>
			</b-container>
		</main>

		<register :modalId="'registerModal'"></register>
		<login :modalId="'loginModal'"></login>
	</section>
</template>

<script>
  import MyFooter from '~/components/Footer.vue'
  import Search from '~/components/Search.vue'
  import Breadcrumb from '~/components/Breadcrumb.vue'
  import Register from '~/components/Register.vue'
  import Login from '~/components/Login.vue'

  export default {
    components: {
      MyFooter,
      Search,
      Breadcrumb,
      Register,
      Login,
    },
    computed: {
      user () {
        let user = this.$store.state.user
        return user ? user.data : null
      },
    },
    mounted () {
      let self = this

      self.$store.dispatch('user/getCachedUser')
    },
    methods: {
      async onLogout () {
        let self = this

        await self.$store.dispatch('user/logout')

        // Redirect to home page.
        self.$router.replace({name: 'index'})
      },
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
		vertical-align: bottom;
	}

	main, footer {
		margin-top: 35px;
	}

	.container {
		transition: all .5s cubic-bezier(.55, 0, .1, 1);
	}

	.page-enter-active, .page-leave-active {
		transition: opacity .5s
	}

	.page-enter, .page-leave-active {
		opacity: 0
	}

	.bounce-enter-active {
		animation: bounce-in .8s;
	}

	.bounce-leave-active {
		animation: bounce-out .5s;
	}

	@keyframes bounce-in {
		0% {
			transform: scale(0)
		}
		50% {
			transform: scale(1.5)
		}
		100% {
			transform: scale(1)
		}
	}

	@keyframes bounce-out {
		0% {
			transform: scale(1)
		}
		50% {
			transform: scale(1.5)
		}
		100% {
			transform: scale(0)
		}
	}

</style>
