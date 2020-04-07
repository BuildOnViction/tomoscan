import mixin from '~/plugins/mixin'

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
            Object.assign(data, { title: title, location: location }))
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
const br = new BreadCrumbManager()
br.register('index', (brs) => {
    brs.push('Home', { name: 'index' })
})
br.register('blocks', (brs) => {
    brs.parent('index')
    brs.push('Blocks', { name: 'blocks' })
})
br.register('blocks-slug', (brs, location) => {
    brs.parent('blocks')
    brs.push('Block #' + location.params.slug, location)
})
br.register('accounts', (brs) => {
    brs.parent('index')
    brs.push('Accounts', { name: 'accounts' })
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
    const block = mixin.methods.getParameterByName('block')
    if (block) {
        brs.push('Blocks', { name: 'blocks' })
        brs.push(`Transaction for Block #${block}`, window.location.pathname + window.location.search)
    } else {
        brs.push('Transactions', { name: 'txs' })
    }
})
br.register('txs-slug', (brs, location) => {
    brs.parent('txs')
    brs.push('Transaction Detail', location)
})
br.register('tokens', (brs) => {
    brs.parent('index')
    brs.push('Tokens', { name: 'tokens' })
})
br.register('orders', (brs) => {
    brs.parent('index')
    brs.push('Orders', { name: 'orders' })
})
br.register('orders-slug', (brs, location) => {
    brs.parent('orders')
    brs.push('Orders Detail', location)
})
br.register('trades', (brs) => {
    brs.parent('index')
    brs.push('Trades History', { name: 'trades' })
})
br.register('trades-slug', (brs, location) => {
    brs.parent('trades')
    brs.push('Trade Detail', location)
})
br.register('tokens-slug', (brs, location) => {
    brs.parent('tokens')
    brs.push('Token Detail', location)
})
br.register('tokens-trc20', (brs, location) => {
    brs.parent('tokens')
    brs.push('TRC20 Token', location)
})
br.register('tokens-trc21', (brs, location) => {
    brs.parent('tokens')
    brs.push('TRC21 Token', location)
})
br.register('tokens-nft', (brs, location) => {
    brs.parent('tokens')
    brs.push('TRC721 Token', location)
})
br.register('tokens-slug-info', (brs, location) => {
    brs.parent('tokens')
    brs.push('Update Token Info', location)
})
br.register('tokentxs', (brs) => {
    brs.parent('index')
    brs.push('Token (TRC20) Transfers', { name: 'tokentxs' })
})
br.register('tokentxs-nft', (brs) => {
    brs.parent('index')
    brs.push('Token (TRC721) Transfers', { name: 'tokentxs-nft' })
})
br.register('tokentxs-trc21', (brs) => {
    brs.parent('index')
    brs.push('Token (TRC21) Transfers', { name: 'tokentxs-trc21' })
})
br.register('follows', (brs) => {
    brs.parent('index')
    brs.push('Follow List', { name: 'follows' })
})
br.register('contracts', (brs) => {
    brs.parent('index')
    brs.push('Contracts', { name: 'contracts' })
})
br.register('contracts-verify', (brs) => {
    brs.parent('contracts')
    brs.push('Contracts Verify', { name: 'contracts-verify' })
})
br.register('reset-password', (brs) => {
    brs.parent('index')
    brs.push('Reset Password', { name: 'accounts-reset-password' })
})
br.register('sign-txs', (brs) => {
    brs.parent('txs')
    brs.push('Sign Transactions', { name: 'txs-signTxs' })
})
br.register('other-txs', (brs) => {
    brs.parent('txs')
    brs.push('Normal Transactions', { name: 'txs-normalTxs' })
})
br.register('masternodes', (brs) => {
    brs.parent('accounts')
    brs.push('Masternodes', { name: 'masternodes' })
})
br.register('epochs', (brs) => {
    brs.parent('index')
    brs.push('Epochs', { name: 'epochs' })
})
br.register('download', (brs) => {
    brs.parent('index')
    brs.push('Download', { name: 'download' })
})
br.register('epochs-slug', (brs) => {
    brs.parent('epochs')
    brs.push('Epochs detail', { name: 'epochs-slug' })
})
br.register('lending-orders', (brs) => {
    brs.parent('index')
    brs.push('Lending Orders', { name: 'lending-orders' })
})
br.register('lending-orders-slug', (brs) => {
    brs.parent('lending-orders')
    brs.push('Lending Order Detail', { name: 'lending-orders-slug' })
})
br.register('lending-trades', (brs) => {
    brs.parent('index')
    brs.push('Lending Trades', { name: 'lending-trades' })
})
br.register('lending-trades-slug', (brs) => {
    brs.parent('lending-trades')
    brs.push('Lending Trade Detail', { name: 'lending-trades-slug' })
})
br.register('lending-topup', (brs) => {
    brs.parent('index')
    brs.push('Lending TopUp', { name: 'lending-topup' })
})
br.register('lending-topup-slug', (brs) => {
    brs.parent('lending-topup')
    brs.push('Lending TopUp Detail', { name: 'lending-topup-slug' })
})
br.register('lending-repay', (brs) => {
    brs.parent('index')
    brs.push('Lending Repay', { name: 'lending-repay' })
})
br.register('lending-repay-slug', (brs) => {
    brs.parent('lending-repay')
    brs.push('Lending Repay Detail', { name: 'lending-repay-slug' })
})
br.register('relayers', (brs) => {
    brs.parent('index')
    brs.push('Relayers', { name: 'relayers' })
})

export const state = () => ({
    items: null
})

export const mutations = {
    setItems (state, payload) {
        state.items = br.generate(payload.name, payload.to)
    }
}

export const actions = {}

export const strict = false
