<template>
    <section>
        <b-navbar
            toggleable="lg"
            variant="white"
            class="tomo-nav">
            <div class="container container--wide tomo-nav__wrapper">
                <b-navbar-brand :to="{name: 'index'}">
                    <img
                        src="~/assets/img/logoLight.svg"
                        alt="TomoScan"
                        class="tomo-nav__logo logo-light">
                    <img
                        src="~/assets/img/logoDark.svg"
                        alt="TomoScan"
                        class="tomo-nav__logo logo-dark">
                </b-navbar-brand>
                <b-navbar-toggle
                    class="tomo-nav__toggle"
                    target="nav_collapse">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 800 600">
                        <path
                            id="top"
                            d="M300,220 C300,220 520,220 540,220 C740,220 640,540 520,420 C440,340 300,200 300,200"/>
                        <path
                            id="middle"
                            d="M300,320 L540,320"/>
                        <path
                            id="bottom"
                            d="M300,210 C300,210 520,210 540,210 C740,210 640,530 520,410 C440,330 300,190 300,190"
                            transform="translate(480, 320) scale(1, -1) translate(-480, -318) "/>
                    </svg>
                </b-navbar-toggle>

                <b-collapse
                    id="nav_collapse"
                    is-nav>
                    <b-navbar-nav class="mx-auto">
                        <b-nav-item
                            :to="{name: 'index'}"
                            :exact="true">Home</b-nav-item>
                        <b-nav-item-dropdown
                            :class="(isTxs) ? 'active' : ''"
                            text="Transactions">
                            <b-dropdown-item :to="{name: 'txs'}">All Transactions</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'txs-normalTxs'}">Normal Transactions</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'txs-signTxs'}">Signing Transactions</b-dropdown-item>
                        </b-nav-item-dropdown>
                        <b-nav-item-dropdown
                            :class="(isAccounts || isContracts) ? 'active' : ''"
                            text="Accounts">
                            <b-dropdown-item :to="{name: 'accounts'}">All Accounts</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'masternodes'}">All Masternodes</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'contracts'}">Verified Contracts</b-dropdown-item>
                        </b-nav-item-dropdown>
                        <b-nav-item-dropdown
                            :class="(isTokens || isTokenTxs) ? 'active' : ''"
                            text="Tokens">
                            <b-dropdown-item :to="{name: 'tokens-trc20'}">TRC20 Tokens</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'tokentxs'}">TRC20 Transfers</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'tokens-trc21'}">TRC21 Tokens</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'tokentxs-trc21'}">TRC21 Transfers</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'tokens-nft'}">TRC721 Tokens</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'tokentxs-nft'}">TRC721 Transfers</b-dropdown-item>
                        </b-nav-item-dropdown>
                        <b-nav-item-dropdown
                            text="Blocks">
                            <b-dropdown-item :to="{name: 'blocks'}">Blocks</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'epochs'}">Epochs</b-dropdown-item>
                        </b-nav-item-dropdown>
                        <b-nav-item-dropdown
                            text="Exchanges">
                            <b-dropdown-item :to="{name: 'relayers'}">Relayers</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'orders'}">Orders</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'trades'}">Trade History</b-dropdown-item>
                            <li
                                id="lending-nav-id"
                                class="nav-item lending-nav"
                                @click="addClass()">
                                <div class="nav-link-custom"><span>Lending</span></div>
                                <ul class="dropdown-menu">
                                    <b-dropdown-item :to="{name: 'lending-orders'}">
                                        Lending Order</b-dropdown-item>
                                    <b-dropdown-item :to="{name: 'lending-trades'}">
                                        Lending Trade</b-dropdown-item>
                                    <b-dropdown-item :to="{name: 'lending-topup'}">
                                        Lending TopUp</b-dropdown-item>
                                    <b-dropdown-item :to="{name: 'lending-repay'}">
                                        Lending Repay</b-dropdown-item>
                                    <b-dropdown-item :to="{name: 'lending-recalls'}">
                                        Lending Recall</b-dropdown-item>
                                </ul>
                            </li>
                        </b-nav-item-dropdown>
                    </b-navbar-nav>
                    <b-navbar-nav class="tomo-nav__login">
                        <b-nav-item
                            :href="'https://docs.tomochain.com/faq/products/tomochain-applications/tomoscan-explorer'"
                            :target="'_blank'">Need help?</b-nav-item>
                            <!-- <b-nav-item
                            v-b-modal="'loginModal'"
                            v-if="!user">Login</b-nav-item>
                        <b-nav-item
                            v-b-modal="'registerModal'"
                            v-if="!user">Register</b-nav-item>
                        <b-nav-item-dropdown
                            v-if="user"
                            right>
                            <template slot="button-content">
                                <em>{{ user.email }}</em>
                            </template>
                            <b-dropdown-item :to="{name: 'follows'}">
                                <i class="tm-list mr-3"/>Follow List
                            </b-dropdown-item>
                            <b-dropdown-item @click="onLogout">
                                <i class="tm-logout mr-3"/>Logout
                            </b-dropdown-item>
                        </b-nav-item-dropdown> -->
                    </b-navbar-nav>
                    <div
                        id="dark-mode-toggle">
                        <input
                            id="dark-mode-checkbox"
                            :checked="darkMode"
                            type="checkbox"
                            @click="toggleDarkMode">
                        <div class="toggle-switch">&nbsp;</div>
                        <div class="toggle-bg">&nbsp;</div>
                    </div>
                </b-collapse>
            </div>
        </b-navbar>

        <main
            :class="isHomePage ? 'tomo-body-wrapper--home' : ''"
            class="tomo-body-wrapper">
            <div class="container container--wide">
                <div
                    v-if="! isHomePage"
                    class="row align-items-center tomo-body-wrapper__heading">
                    <b-col sm="5">
                        <breadcrumb/>
                    </b-col>
                    <b-col sm="7">
                        <div class="input-group search-form search-form--mini">
                            <div class="input-group-prepend">
                                <button
                                    class="btn btn-primary search-form__btn"
                                    @click="onGotoRoute"><i class="fa fa-search"/></button>
                            </div>
                            <input
                                v-model="search"
                                type="text"
                                class="form-control search-form__input"
                                placeholder="Search"
                                @keyup.enter="onGotoRoute">
                        </div>
                    </b-col>
                </div>
                <b-row
                    v-else
                    class="justify-content-md-center">
                    <b-col
                        lg="8"
                        class="col-2xl-9">
                        <div class="input-group search-form">
                            <b-input-group class="mt-3">
                                <b-form-input
                                    v-model="search"
                                    class="form-control search-form__input"
                                    placeholder="Search Address / TX / Block..."
                                    @keyup.enter="onGotoRoute"/>
                                <b-input-group-append>
                                    <b-button
                                        variant="primary"
                                        class="search-form__btn"
                                        @click="onGotoRoute">
                                        <i class="tm-search"/></b-button>
                                </b-input-group-append>
                            </b-input-group>
                        </div>
                        <div class="tomo-stat d-flex">
                            <div class="tomo-stat__item">
                                <nuxt-link :to="{name: 'accounts'}">
                                    <i
                                        v-if="! stats"
                                        class="tomo-loading"/>
                                    <span v-else>{{ formatNumber(stats.totalAddress) }}&nbsp;Accounts</span>
                                </nuxt-link>
                            </div>
                            <div class="tomo-stat__item">
                                <nuxt-link :to="{name: 'tokens'}">
                                    <i
                                        v-if="! stats"
                                        class="tomo-loading"/>
                                    <span v-else>{{ formatNumber(stats.totalToken) }}&nbsp;Tokens</span>
                                </nuxt-link>
                            </div>
                            <div class="tomo-stat__item">
                                <nuxt-link :to="{name: 'contracts'}">
                                    <i
                                        v-if="! stats"
                                        class="tomo-loading"/>
                                    <span v-else>{{ formatNumber(stats.totalSmartContract) }}&nbsp;Contracts</span>
                                </nuxt-link>
                            </div>
                            <div class="tomo-stat__item">
                                <nuxt-link :to="{name: 'blocks'}">
                                    <i
                                        v-if="! stats"
                                        class="tomo-loading"/>
                                    <span v-else>{{ formatNumber(stats.totalBlock) }}&nbsp;Blocks</span>
                                </nuxt-link>
                            </div>
                        </div>
                    </b-col>
                    <div class="w-100"/>
                    <b-col cols="5">
                        <apexchart
                            type="line"
                            height="350"
                            :options="txChartOptions"
                            :series="txSeries"/>
                    </b-col>
                    <b-col cols="5">
                        <apexchart
                            type="line"
                            height="350"
                            :options="accountChartOptions"
                            :series="accountSeries"/>
                    </b-col>
                    <div class="w-100"/>
                    <b-col cols="5">
                        <apexchart
                            type="line"
                            height="350"
                            :options="tradeChartOptions"
                            :series="tradeSeries"/>
                    </b-col>
                    <b-col cols="5">
                        <apexchart
                            type="line"
                            height="350"
                            :options="lendingChartOptions"
                            :series="lendingSeries"/>
                    </b-col>
                </b-row>
                <nuxt/>
            </div>
        </main>

        <footer class="tomo-footer">
            <div class="container container--wide">
                <div class="row">
                    <b-col
                        md="6"
                        class="tomo-footer__copyright">
                        <p>TomoScan {{ (new Date()).getFullYear() }} - <a
                            :href="`https://github.com/tomochain/tomoscan/releases/tag/v${version}`">
                            v{{ version }}</a>

                            <code class="text-muted copyright__code">
                                TomoChain/stable/linux-amd64/golang
                            </code>
                        </p>
                    </b-col>
                    <b-col
                        md="6"
                        class="text-md-right">
                        <ul class="list-inline tomo-footer__social">
                            <li class="list-inline-item">
                                <a
                                    href="https://t.me/tomochain"
                                    target="_blank">
                                    <i class="fa fa-telegram"/>
                                </a>
                            </li>
                            <li class="list-inline-item">
                                <a
                                    href="https://www.facebook.com/tomochainofficial"
                                    target="_blank">
                                    <i class="fa fa-facebook"/>
                                </a>
                            </li>
                            <li class="list-inline-item">
                                <a
                                    href="https://twitter.com/TomoChainANN"
                                    target="_blank">
                                    <i class="fa fa-twitter"/>
                                </a>
                            </li>
                            <li class="list-inline-item">
                                <a
                                    href="https://github.com/tomochain/"
                                    target="_blank">
                                    <i class="fa fa-github"/>
                                </a>
                            </li>
                            <li class="list-inline-item">
                                <a
                                    href="https://www.reddit.com/r/Tomochain/"
                                    target="_blank">
                                    <i class="fa fa-reddit"/>
                                </a>
                            </li>
                        </ul>
                    </b-col>
                </div>
            </div>
        </footer>

        <register :modal-id="'registerModal'"/>
        <login :modal-id="'loginModal'"/>
        <forgot-password :modal-id="'forgotPwModal'"/>
    </section>
</template>

<script>
import Cookie from 'js-cookie'
import mixin from '~/plugins/mixin'
import Breadcrumb from '~/components/Breadcrumb.vue'
import Register from '~/components/Register.vue'
import Login from '~/components/Login.vue'
import ForgotPassword from '~/components/ForgotPassword.vue'
import pkg from '../package.json'

export default {
    components: {
        Breadcrumb,
        Register,
        Login,
        ForgotPassword
    },
    mixins: [mixin],
    data () {
        return {
            darkMode: false,
            search: null,
            stats: null,
            version: pkg.version,

            accountSeries: [{
                name: 'Total Account',
                data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
            }],
            accountChartOptions: {
                chart: {
                    height: 350,
                    type: 'line',
                    zoom: {
                        enabled: false
                    }
                },
                dataLabels: {
                    enabled: false
                },
                stroke: {
                    curve: 'straight'
                },
                title: {
                    text: 'Account Growth',
                    align: 'center'
                },
                grid: {
                    row: {
                        colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
                        opacity: 0.5
                    }
                },
                xaxis: {
                    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
                }
            },

            txSeries: [
                {
                    name: 'Normal Transaction',
                    data: [35, 41, 62, 42, 13, 18, 29, 37, 36, 51, 32, 35]
                },
                {
                    name: 'Sign Transaction',
                    data: [87, 57, 74, 99, 75, 38, 62, 47, 82, 56, 45, 47]
                },
                {
                    name: 'Internal Transaction',
                    data: [30, 47, 34, 79, 45, 68, 52, 27, 52, 36, 15, 77]
                }
            ],
            txChartOptions: {
                chart: {
                    height: 350,
                    type: 'line',
                    zoom: {
                        enabled: true
                    }
                },
                stroke: {
                    width: [5, 5, 5],
                    curve: 'smooth',
                    dashArray: [0, 8, 5]
                },
                title: {
                    text: 'Transaction Statistics',
                    align: 'center'
                },
                xaxis: {
                    categories: ['01 Jan', '02 Jan', '03 Jan', '04 Jan', '05 Jan',
                        '06 Jan', '07 Jan', '08 Jan', '09 Jan',
                        '10 Jan', '11 Jan', '12 Jan'
                    ]
                },
                grid: {
                    borderColor: '#f1f1f1'
                }
            },

            tradeSeries: [
                {
                    name: 'Trade Number',
                    data: [45, 52, 38, 24, 33, 26, 21, 20, 6, 8, 15, 10]
                },
                {
                    name: 'Order Number',
                    data: [35, 41, 62, 42, 13, 18, 29, 37, 36, 51, 32, 35]
                }
            ],
            tradeChartOptions: {
                chart: {
                    height: 350,
                    type: 'line',
                    zoom: {
                        enabled: false
                    }
                },
                stroke: {
                    curve: 'smooth'
                },
                title: {
                    text: 'Trading Statistics',
                    align: 'center'
                },
                xaxis: {
                    categories: ['01 Jan', '02 Jan', '03 Jan', '04 Jan', '05 Jan',
                        '06 Jan', '07 Jan', '08 Jan', '09 Jan',
                        '10 Jan', '11 Jan', '12 Jan'
                    ]
                },
                grid: {
                    borderColor: '#f1f1f1'
                }
            },

            lendingSeries: [
                {
                    name: 'Lending Order',
                    data: [45, 52, 38, 24, 33, 26, 21, 20, 6, 8, 15, 10]
                },
                {
                    name: 'Lending Trade',
                    data: [35, 41, 62, 42, 13, 18, 29, 37, 36, 51, 32, 35]
                }
            ],
            lendingChartOptions: {
                chart: {
                    height: 350,
                    type: 'line',
                    zoom: {
                        enabled: false
                    }
                },
                stroke: {
                    curve: 'smooth'
                },
                title: {
                    text: 'Lending Statistics',
                    align: 'center'
                },
                xaxis: {
                    categories: ['01 Jan', '02 Jan', '03 Jan', '04 Jan', '05 Jan',
                        '06 Jan', '07 Jan', '08 Jan', '09 Jan',
                        '10 Jan', '11 Jan', '12 Jan'
                    ]
                },
                grid: {
                    borderColor: '#f1f1f1'
                }
            }
        }
    },
    computed: {
        user () {
            const user = this.$store.state.user
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
            const name = this.$route.name
            return name ? name.indexOf(['index']) >= 0 : false
        }
    },
    watch: {
        $route (to, from) {
            if (this.isHomePage) {
                this.getStats()
            }
        }
    },
    mounted () {
        const self = this

        self.$store.dispatch('user/getCachedUser')

        if (self.isHomePage) {
            self.getStats()
        }

        self.darkMode = Cookie.get('tomoscan_theme') === 'dark'

        if (typeof Cookie.get('tomoscan_theme') === 'undefined') {
            document.getElementById('dark-mode-toggle').classList.add('try-dark-mode')
        }
    },
    methods: {

        async onLogout () {
            const self = this

            await self.$store.dispatch('user/logout')

            // Redirect to home page.
            self.$router.replace({ name: 'index' })
        },
        onGotoRoute () {
            const search = this.search.trim()
            const regexpTx = /[0-9a-zA-Z]{66}?/
            const regexpAddr = /^(0x)?[0-9a-fA-F]{40}$/
            const regexpBlock = /[0-9]+?/
            let to = null

            if (regexpAddr.test(search)) {
                to = { name: 'address-slug', params: { slug: search } }
            } else if (regexpTx.test(search)) {
                to = { name: 'txs-slug', params: { slug: search } }
            } else if (regexpBlock.test(search)) {
                to = { name: 'blocks-slug', params: { slug: search } }
            }

            if (!to) {
                return false
            }

            return this.$router.push(to)
        },
        async getStats () {
            const self = this
            const { data } = await self.$axios.get('/api/setting')
            self.stats = data.stats
        },
        toggleDarkMode (e) {
            const darkMode = Cookie.get('tomoscan_theme') !== 'dark'
            this.darkMode = darkMode

            Cookie.set('tomoscan_theme', darkMode ? 'dark' : 'light', {
                expires: 365
            })

            e.target.parentElement.classList.remove('try-dark-mode')

            if (darkMode) {
                document.body.classList.add('dark-mode')
            } else {
                document.body.classList.remove('dark-mode')
            }
        },
        addClass () {
            const item = document.getElementById('lending-nav-id')
            item.classList.toggle('active')
        }
    }
}
</script>
