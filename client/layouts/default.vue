<template>
	<section>
		<b-navbar toggleable="md" variant="white" class="tm__nav">
			<div class="container tm__nav_wrapper">
				<b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
				<b-navbar-brand :to="{name: 'index'}">
					<img src="~/assets/img/logo.png" alt="TOMO Explorer" class="tm__logo">
				</b-navbar-brand>

				<b-collapse is-nav id="nav_collapse">
					<b-navbar-nav class="mx-auto">
						<b-nav-item :to="{name: 'blocks'}">Blocks</b-nav-item>
						<b-nav-item-dropdown text="Transactions">
							<b-dropdown-item :to="{name: 'txs'}" @click="onActiveMenu()">All Transactions</b-dropdown-item>
							<!--<b-dropdown-item :to="{name: 'txs-pending'}">Transactions Pending</b-dropdown-item>-->
						</b-nav-item-dropdown>
						<b-nav-item-dropdown text="Accounts">
							<b-dropdown-item :to="{name: 'accounts'}">All Accounts</b-dropdown-item>
							<b-dropdown-item :to="{name: 'contracts'}">Verified Contracts</b-dropdown-item>
						</b-nav-item-dropdown>
						<b-nav-item-dropdown text="Tokens">
							<b-dropdown-item :to="{name: 'tokens'}">All Tokens</b-dropdown-item>
							<b-dropdown-item :to="{name: 'tokentxs'}">Token Transfers</b-dropdown-item>
						</b-nav-item-dropdown>
					</b-navbar-nav>
					<b-navbar-nav>
						<!--<div class="form-inline" v-if="! isHomePage()">-->
						<!--<input type="search" v-model="search" class="form-control form-control-sm" placeholder="Search Address / TX / Block" @keyup.enter="onGotoRoute"/>-->
						<!--<b-button variant="primary" size="sm" class="my-2 my-sm-0" @click="onGotoRoute"><i class="fa fa-search"></i></b-button>-->
						<!--</div>-->

						<b-nav-item v-b-modal="'loginModal'" v-if="!user">Login</b-nav-item>
						<b-nav-item v-b-modal="'registerModal'" v-if="!user">Register</b-nav-item>
						<b-nav-item-dropdown right v-if="user">
							<template slot="button-content">
								<em>{{ user.email }}</em>
							</template>
							<b-dropdown-item :to="{name: 'follows'}">Follow List</b-dropdown-item>
							<b-dropdown-item @click="onLogout">Logout</b-dropdown-item>
						</b-nav-item-dropdown>
					</b-navbar-nav>
				</b-collapse>
			</div>
		</b-navbar>

		<main class="tm__body_wrapper">
			<div class="container">
				<breadcrumb v-if="! isHomePage()"/>
				<div class="jumbotron" v-if="isHomePage()">
					<b-row>
						<b-col sm="3"></b-col>
						<b-col sm="6">
							<div class="input-group">
								<input type="text" v-model="search" class="form-control" placeholder="Search Address / TX / Block..." @keyup.enter="onGotoRoute">
								<div class="input-group-append">
									<button class="btn btn-primary" @click="onGotoRoute">Search</button>
								</div>
							</div>
						</b-col>
						<b-col sm="3"></b-col>
					</b-row>
				</div>

				<nuxt/>
			</div>
		</main>

		<register :modalId="'registerModal'"></register>
		<login :modalId="'loginModal'"></login>
	</section>
</template>

<script>
  import MyFooter from '~/components/Footer.vue'
  import Breadcrumb from '~/components/Breadcrumb.vue'
  import Register from '~/components/Register.vue'
  import Login from '~/components/Login.vue'

  export default {
    components: {
      MyFooter,
      Breadcrumb,
      Register,
      Login,
    },
    data () {
      return {
        search: null,
      }
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
      isHomePage () {
        let name = this.$route.name
        return name ? name.indexOf(['index']) >= 0 : false
      },
      async onLogout () {
        let self = this

        await self.$store.dispatch('user/logout')

        // Redirect to home page.
        self.$router.replace({name: 'index'})
      },
      onGotoRoute () {
        let search = this.search.trim()
        let regexpTx = /[0-9a-zA-Z]{66}?/
        let regexpAddr = /^(0x)?[0-9a-f]{40}$/
        let regexpBlock = /[0-9]+?/
        let to = null

        if (regexpAddr.test(search)) {
          to = {name: 'address-slug', params: {slug: search}}
        }
        else if (regexpTx.test(search)) {
          to = {name: 'txs-slug', params: {slug: search}}
        }
        else if (regexpBlock.test(search)) {
          to = {name: 'blocks-slug', params: {slug: search}}
        }

        if (!to) {
          return false
        }

        return this.$router.push(to)
      },
      onActiveMenu() {
        console.log(123)
      }
    },
  }
</script>

<style>
</style>
