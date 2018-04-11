import numeral from 'numeral'
import moment from 'moment'
import web3 from 'web3'

const mixin = {
  methods: {
    serializeQuery: (params, prefix) => {
      const query = Object.keys(params).map((key) => {
        const value = params[key]

        if (params.constructor === Array)
          key = `${prefix}[]`
        else if (params.constructor === Object)
          key = (prefix ? `${prefix}[${key}]` : key)

        if (typeof value === 'object')
          return serializeQuery(value, key)
        else
          return `${key}=${encodeURIComponent(value)}`
      })

      return [].concat.apply([], query).join('&')
    },

    formatNumber: (number) => numeral(number).format('0,0[.]00'),

    formatBigNumber: (number) => numeral(number).format('0,0[.]00000'),

    moment: (date) => moment(date),

    toEther: (wei) => wei ? web3.utils.fromWei(wei.toString(), 'ether') + ' Ether' : '',

    toGwei: (wei) => wei ? web3.utils.fromWei(wei.toString(), 'gwei') : ''
  },
}

export default mixin