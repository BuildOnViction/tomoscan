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

  call (name, params = []) {
    if (typeof this.callbacks[name] === 'undefined') {
      throw new Error('Breadcrumb not found with name ' + name)
    }

    this.callbacks[name](this, params)
  }

  parent (name, params = []) {
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
    if (typeof this.callbacks[name] !== 'undefined') {
      throw new Error('Breadcrumb name "' + name +
        '" has already been registered')
    }

    this.callbacks[name] = callback
  }

  generate (name, params = []) {
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
br.register('blocks-slug', (brs, number) => {
  brs.parent('blocks')
  brs.push('Block #' + number, {name: 'blocks-slug', params: {slug: number}})
})
br.register('accounts', (brs) => {
  brs.parent('index')
  brs.push('Accounts', {name: 'accounts'})
})
br.register('address', (brs, location) => {
  brs.parent('index')
  location.name = 'address'
  brs.push('Address', location)
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

export const state = () => ({
  name: null,
  items: null,
})

export const mutations = {
  setItems (state, items) {
    state.items = items
  },
}

export const actions = {
  setData ({commit}, name, params = []) {
    let items = br.generate(name, params)
    commit('setItems', items)
  },
}

export const strict = false