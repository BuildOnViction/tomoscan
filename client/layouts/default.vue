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
						<b-nav-item :to="{name: 'index'}" :exact="true">Home</b-nav-item>
						<b-nav-item :to="{name: 'blocks'}">Blocks</b-nav-item>
						<b-nav-item-dropdown text="Transactions" :class="(isTxs) ? 'active' : ''">
							<b-dropdown-item :to="{name: 'txs'}">All Transactions</b-dropdown-item>
							<!--<b-dropdown-item :to="{name: 'txs-pending'}">Transactions Pending</b-dropdown-item>-->
						</b-nav-item-dropdown>
						<b-nav-item-dropdown text="Accounts" :class="(isAccounts || isContracts) ? 'active' : ''">
							<b-dropdown-item :to="{name: 'accounts'}">All Accounts</b-dropdown-item>
							<b-dropdown-item :to="{name: 'contracts'}">Verified Contracts</b-dropdown-item>
						</b-nav-item-dropdown>
						<b-nav-item-dropdown text="Tokens" :class="(isTokens || isTokenTxs) ? 'active' : ''">
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
				<div class="jumbotron bg__none" v-else>
					<b-row>
						<b-col sm="3"></b-col>
						<b-col sm="6">
							<div class="input-group search__form">
								<div class="input-group-prepend">
									<button class="btn btn-primary" @click="onGotoRoute"><i class="fa fa-search"></i></button>
								</div>
								<input type="text" v-model="search" class="form-control" placeholder="Search Address / TX / Block..." @keyup.enter="onGotoRoute">
							</div>
							<div class="d-flex justify-content-center">
								<div class="stat__box">
									<nuxt-link :to="{name: 'blocks'}">
										<span-loading v-bind:text="stats ? formatNumber(stats.totalBlock) : null"></span-loading>&nbsp;Block
									</nuxt-link>
								</div>
								<div class="stat__box">
									<nuxt-link :to="{name: 'accounts'}">
										<span-loading v-bind:text="stats ? formatNumber(stats.totalAddress) : null"></span-loading>&nbsp;Wallet
									</nuxt-link>
								</div>
								<div class="stat__box">
									<nuxt-link :to="{name: 'tokens'}">
										<span-loading v-bind:text="stats ? formatNumber(stats.totalToken) : null"></span-loading>&nbsp;Token
									</nuxt-link>
								</div>
								<div class="stat__box">
									<nuxt-link :to="{name: 'contracts'}">
										<span-loading v-bind:text="stats ? formatNumber(stats.totalSmartContract) : null"></span-loading>&nbsp;Contract
									</nuxt-link>
								</div>
							</div>
						</b-col>
						<b-col sm="3"></b-col>
					</b-row>
				</div>

				<nuxt/>
			</div>
		</main>

		<footer>
			<div class="container">
				<div class="row">
					<div class="col">Tomoscan 2018 - Running Tomochain</div>
					<div class="col"></div>
				</div>
			</div>
		</footer>

		<register :modalId="'registerModal'"></register>
		<login :modalId="'loginModal'"></login>
	</section>
</template>

<script>
  import mixin from '~/plugins/mixin'
  import MyFooter from '~/components/Footer.vue'
  import Breadcrumb from '~/components/Breadcrumb.vue'
  import Register from '~/components/Register.vue'
  import Login from '~/components/Login.vue'
  import SpanLoading from '~/components/SpanLoading'

  export default {
    mixins: [mixin],
    components: {
      MyFooter,
      Breadcrumb,
      Register,
      Login,
      SpanLoading,
    },
    data () {
      return {
        search: null,
        stats: null,
      }
    },
    computed: {
      user () {
        let user = this.$store.state.user
        return user ? user.data : null
      },
      isTxs () {
        return this.$route.fullPath.startsWith('/txs')
      },
      isAccounts () {
        return this.$route.fullPath.startsWith('/accounts')
      },
      isContracts () {
        return this.$route.fullPath.startsWith('/contracts')
      },
      isTokens () {
        return this.$route.fullPath.startsWith('/tokens')
      },
      isTokenTxs () {
        return this.$route.fullPath.startsWith('/tokentxs')
      },
    },
    mounted () {
      let self = this

      self.$store.dispatch('user/getCachedUser')

      if (self.isHomePage()) {
        self.getStats()
      }
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
      async getStats () {
        let self = this
        let {data} = await self.$axios.get('/api/setting')
        self.stats = data.stats
      },
    },
  }
</script>

<style type="text/scss" lang="scss">
	footer {
		margin-bottom: 50px;
	}

	.jumbotron {
		padding: 15rem 2rem;
	}

	.stat__box {
		padding: 0 70px;
		display: inline-block;

		a {
			color: #868f9b;

			&:hover {
				color: #34a1ff;
			}
		}
	}

	.search__form {
		margin-bottom: 60px;

		.input-group-prepend {
			.btn {
				height: 60px;
				width: 60px;
				border-radius: 50%;
				box-shadow: 8px 8px 40px 0 rgba(0, 0, 0, 0.18);
				margin-right: 25px;
			}
		}

		.form-control {
			box-shadow: 8px 8px 40px 0 rgba(0, 0, 0, 0.07);
			border-radius: 100px !important;
			padding: 0.375rem 40px;
			border: none !important;

			&::placeholder {
				color: rgb(167, 167, 167) !important;
			}
		}
	}
</style>
