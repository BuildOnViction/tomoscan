<template>
	<section>
		<b-navbar toggleable="lg" variant="white" class="tomo-nav">
			<div class="container container--wide tomo-nav__wrapper">
				<b-navbar-brand :to="{name: 'index'}">
					<img src="~/assets/img/logo.png" alt="TOMO Explorer" class="tomo-nav__logo">
				</b-navbar-brand>
				<b-navbar-toggle class="tomo-nav__toggle" target="nav_collapse">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
						<path d="M300,220 C300,220 520,220 540,220 C740,220 640,540 520,420 C440,340 300,200 300,200" id="top"></path>
						<path d="M300,320 L540,320" id="middle"></path>
						<path d="M300,210 C300,210 520,210 540,210 C740,210 640,530 520,410 C440,330 300,190 300,190" id="bottom" transform="translate(480, 320) scale(1, -1) translate(-480, -318) "></path>
					</svg>
				</b-navbar-toggle>

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
					<b-navbar-nav class="tomo-nav__login">
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

		<main class="tomo-body-wrapper" :class="isHomePage ? 'tomo-body-wrapper--home' : ''">
			<div class="container container--wide">
				<div class="row align-items-center tomo-body-wrapper__heading" v-if="! isHomePage">
					<b-col sm="5">
						<breadcrumb/>
					</b-col>
					<b-col sm="7">
						<div class="input-group search-form search-form--mini">
							<div class="input-group-prepend">
								<button class="btn btn-primary search-form__btn" @click="onGotoRoute"><i class="fa fa-search"></i></button>
							</div>
							<input type="text" v-model="search" class="form-control search-form__input" placeholder="Search" @keyup.enter="onGotoRoute">
						</div>
					</b-col>
				</div>
				<b-row v-else>
						<b-col lg="8" class="offset-lg-2 offset-2xl-3 col-2xl-6">
							<div class="input-group search-form">
								<div class="input-group-prepend">
									<button class="btn btn-primary search-form__btn" @click="onGotoRoute"><i class="tm-search"></i></button>
								</div>
								<input type="text" v-model="search" class="form-control search-form__input" placeholder="Search Address / TX / Block..." @keyup.enter="onGotoRoute">
							</div>
							<div class="tomo-stat d-flex">
								<div class="tomo-stat__item">
									<nuxt-link :to="{name: 'blocks'}">
										<i v-if="! stats" class="tomo-loading"></i>
										<span v-else>{{ formatNumber(stats.totalBlock) }}&nbsp;Blocks</span>
									</nuxt-link>
								</div>
								<div class="tomo-stat__item">
									<nuxt-link :to="{name: 'accounts'}">
										<i v-if="! stats" class="tomo-loading"></i>
										<span v-else>{{ formatNumber(stats.totalAddress) }}&nbsp;Wallets</span>
									</nuxt-link>
								</div>
								<div class="tomo-stat__item">
									<nuxt-link :to="{name: 'tokens'}">
										<i v-if="! stats" class="tomo-loading"></i>
										<span v-else>{{ formatNumber(stats.totalToken) }}&nbsp;Tokens</span>
									</nuxt-link>
								</div>
								<div class="tomo-stat__item">
									<nuxt-link :to="{name: 'contracts'}">
										<i v-if="! stats" class="tomo-loading"></i>
										<span v-else>{{ formatNumber(stats.totalSmartContract) }}&nbsp;Contracts</span>
									</nuxt-link>
								</div>
							</div>
						</b-col>
					</b-row>
				<nuxt/>
			</div>
		</main>

		<footer class="tomo-footer">
			<div class="container container--wide">
				<div class="row">
					<b-col md="6" class="tomo-footer__copyright">
						<p>Tomoscan 2018 - Running Tomochain</p>
					</b-col>
					<b-col md="6" class="text-md-right">
						<ul class="list-inline tomo-footer__social">
							<li class="list-inline-item">
								<a href="https://t.me/tomochain" target="_blank">
									<i class="fa fa-telegram"></i>
								</a>
							</li>
							<li class="list-inline-item">
								<a href="https://www.facebook.com/tomochainofficial" target="_blank">
									<i class="fa fa-facebook"></i>
								</a>
							</li>
							<li class="list-inline-item">
								<a href="https://twitter.com/TomoChainANN" target="_blank">
									<i class="fa fa-twitter"></i>
								</a>
							</li>
							<li class="list-inline-item">
								<a href="https://github.com/tomochain/" target="_blank">
									<i class="fa fa-github"></i>
								</a>
							</li>
							<li class="list-inline-item">
								<a href="https://www.reddit.com/r/Tomochain/" target="_blank">
									<i class="fa fa-reddit"></i>
								</a>
							</li>
						</ul>
					</b-col>
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

  export default {
    mixins: [mixin],
    components: {
      MyFooter,
      Breadcrumb,
      Register,
      Login,
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
        return this.$route.fullPath.startsWith('/accounts') || this.$route.fullPath.startsWith('/address')
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
      isHomePage () {
        let name = this.$route.name
        return name ? name.indexOf(['index']) >= 0 : false
      },
    },
    mounted () {
      let self = this

      self.$store.dispatch('user/getCachedUser')

      if (self.isHomePage) {
        self.getStats()
      }
    },
    methods: {

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

