import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

const _d82baaa6 = () => import('../pages/blocks/index.vue' /* webpackChunkName: "pages/blocks/index" */).then(m => m.default || m)
const _02e56e0d = () => import('../pages/accounts/index.vue' /* webpackChunkName: "pages/accounts/index" */).then(m => m.default || m)
const _5f1350be = () => import('../pages/txs/index.vue' /* webpackChunkName: "pages/txs/index" */).then(m => m.default || m)
const _18be8203 = () => import('../pages/txs/pending.vue' /* webpackChunkName: "pages/txs/pending" */).then(m => m.default || m)
const _5d5caf76 = () => import('../pages/txs/_slug.vue' /* webpackChunkName: "pages/txs/_slug" */).then(m => m.default || m)
const _5f1c0cbb = () => import('../pages/address/_slug.vue' /* webpackChunkName: "pages/address/_slug" */).then(m => m.default || m)
const _db98ed36 = () => import('../pages/blocks/_slug.vue' /* webpackChunkName: "pages/blocks/_slug" */).then(m => m.default || m)
const _27803b44 = () => import('../pages/index.vue' /* webpackChunkName: "pages/index" */).then(m => m.default || m)



if (process.client) {
  window.history.scrollRestoration = 'manual'
}
const scrollBehavior = function (to, from, savedPosition) {
  // if the returned position is falsy or an empty object,
  // will retain current scroll position.
  let position = false

  // if no children detected
  if (to.matched.length < 2) {
    // scroll to the top of the page
    position = { x: 0, y: 0 }
  } else if (to.matched.some((r) => r.components.default.options.scrollToTop)) {
    // if one of the children has scrollToTop option set to true
    position = { x: 0, y: 0 }
  }

  // savedPosition is only available for popstate navigations (back button)
  if (savedPosition) {
    position = savedPosition
  }

  return new Promise(resolve => {
    // wait for the out transition to complete (if necessary)
    window.$nuxt.$once('triggerScroll', () => {
      // coords will be used if no selector is provided,
      // or if the selector didn't match any element.
      if (to.hash) {
        let hash = to.hash
        // CSS.escape() is not supported with IE and Edge.
        if (typeof window.CSS !== 'undefined' && typeof window.CSS.escape !== 'undefined') {
          hash = '#' + window.CSS.escape(hash.substr(1))
        }
        try {
          if (document.querySelector(hash)) {
            // scroll to anchor by returning the selector
            position = { selector: hash }
          }
        } catch (e) {
          console.warn('Failed to save scroll position. Please add CSS.escape() polyfill (https://github.com/mathiasbynens/CSS.escape).')
        }
      }
      resolve(position)
    })
  })
}


export function createRouter () {
  return new Router({
    mode: 'history',
    base: '/',
    linkActiveClass: 'nuxt-link-active',
    linkExactActiveClass: 'nuxt-link-exact-active',
    scrollBehavior,
    routes: [
		{
			path: "/blocks",
			component: _d82baaa6,
			name: "blocks"
		},
		{
			path: "/accounts",
			component: _02e56e0d,
			name: "accounts"
		},
		{
			path: "/txs",
			component: _5f1350be,
			name: "txs"
		},
		{
			path: "/txs/pending",
			component: _18be8203,
			name: "txs-pending"
		},
		{
			path: "/txs/:slug",
			component: _5d5caf76,
			name: "txs-slug"
		},
		{
			path: "/address/:slug?",
			component: _5f1c0cbb,
			name: "address-slug"
		},
		{
			path: "/blocks/:slug",
			component: _db98ed36,
			name: "blocks-slug"
		},
		{
			path: "/",
			component: _27803b44,
			name: "index"
		}
    ],
    
    
    fallback: false
  })
}
