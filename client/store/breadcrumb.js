class Breadcrumb {
  constructor () {
    this.breadcrumbs = []
    this.callbacks = []
  }

  generate (callbacks, name, params) {
    this.breadcrumbs = []
    this.callbacks = callbacks

    this.call(name, params)

    return this.breadcrumbs
  }

  call (name, params = {}) {
    if (!name) {
      return
    }
    if (typeof this.callbacks[name] === 'undefined') {
      throw new Error('Breadcrumb not found with name ' + name)
    }

    this.callbacks[name](this, params)
  }

  parent (name, params = {}) {
    if (!name) {
      return
    }

    this.call(name, params)
  }

  push (title, location, data = {}) {
    this.breadcrumbs.push(
      Object.assign(data, {title: title, location: location}))
  }
}

class BreadCrumbManager {
  constructor () {
    this.generator = new Breadcrumb()
    this.callbacks = []
  }

  register (name, callback) {
    if (!name) {
      return
    }

    if (typeof this.callbacks[name] !== 'undefined') {
      throw new Error('Breadcrumb name "' + name +
        '" has already been registered')
    }

    this.callbacks[name] = callback
  }

  generate (name, params) {
    if (!name) {
      return
    }

    return this.generator.generate(this.callbacks, name, params)
  }
}

// Init breadcrumbs routes.
let br = new BreadCrumbManager()
br.register('index', (brs) => {
  brs.push('Home', {name: 'index'})
})
br.register('blocks', (brs) => {
  brs.parent('index')
  brs.push('Blocks', {name: 'blocks'})
})
br.register('blocks-slug', (brs, location) => {
  brs.parent('blocks')
  brs.push('Block #' + location.params.slug, location)
})
br.register('accounts', (brs) => {
  brs.parent('index')
  brs.push('Accounts', {name: 'accounts'})
})
br.register('address-slug', (brs, location) => {
  brs.parent('accounts')
  let title = 'Address Detail'
  if (location instanceof Object) {
    title = location.params.slug
  }
  brs.push(title, location)
})
br.register('txs', (brs) => {
  brs.parent('index')
  brs.push('Transactions', {name: 'txs'})
})
br.register('txs-pending', (brs) => {
  brs.parent('index')
  brs.push('Transactions Pending', {name: 'txs-pending'})
})
br.register('txs-slug', (brs, location) => {
  brs.parent('txs')
  brs.push('Transaction Detail', location)
})
br.register('tokens', (brs) => {
  brs.parent('index')
  brs.push('Tokens', {name: 'tokens'})
})
br.register('tokens-slug', (brs, location) => {
  brs.parent('tokens')
  brs.push('Token Detail', location)
})
br.register('tokentxs', (brs) => {
  brs.parent('index')
  brs.push('Token (ERC20) Transfers', {name: 'tokentxs'})
})
br.register('follows', (brs) => {
  brs.parent('index')
  brs.push('Follow List', {name: 'follows'})
})

export const state = () => ({
  items: null,
})

export const mutations = {
  setItems (state, payload) {
    let items = br.generate(payload.name, payload.to)
    state.items = items
  },
}

export const actions = {}

export const strict = false