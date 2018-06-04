import web3 from 'web3'
import BigNumber from 'bignumber.js'

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
          return this.serializeQuery(value, key)
        else
          return `${key}=${encodeURIComponent(value)}`
      })

      return [].concat.apply([], query).join('&')
    },

    formatNumber: (number) => {
      let seps = number.toString().split('.')
      seps[0] = seps[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

      return seps.join('.')
    },

    toLongNumberString: (n) => {
      let str, str2 = '', data = n.toExponential().replace('.', '').split(/e/i)
      str = data[0]
      let mag = Number(data[1])

      if (mag >= 0 && str.length > mag) {
        mag += 1
        return str.substring(0, mag) + '.' + str.substring(mag)
      }
      if (mag < 0) {
        while (++mag) str2 += '0'
        return '0.' + str2 + str
      }
      mag = (mag - str.length) + 1
      while (mag > str2.length) {
        str2 += '0'
      }

      return str + str2
    },

    toEther: (wei) => {
      if (!wei) {
        return ''
      }
      if (typeof(wei) !== 'string') {
        wei = wei.toString()
      }

      let wei_number = new BigNumber(wei)
      let sfx = ''
      let convert = 'ether'
      if (wei_number.gte(1000000000000000000000000000000)) {
        sfx = '<strong>T</strong>'
        convert = 'tether'
      }

      return mixin.methods.formatNumber(web3.utils.fromWei(wei, convert)) +
        ' ' + sfx
    },

    toEtherNumber: (wei) => web3.utils.fromWei(wei, 'ether'),

    unformatAddress: (address) => address.replace(
      '0x000000000000000000000000', '0x'),

    convertHexToInt: (hex) => parseInt(hex),

    trimWord: (word) => word.replace(/^\s+|\s+$|\s+(?=\s)/g, '').
      replace('\t', '').
      replace(/\u0000/g, '').
      trim(),

    formatUnit: (number, unit = null) => number + ' ' +
      mixin.methods.baseUnit(unit),

    toGwei: (wei) => wei ? mixin.methods.formatNumber(web3.utils.fromWei(wei,
      'gwei')) : '',

    baseUnit: (baseUnit) => {
      baseUnit = baseUnit ? baseUnit : process.env.BASE_UNIT

      return baseUnit
    },

    convertHexToFloat: (str, radix) => {
      var parts = str.split('.')
      if (parts.length > 1) {
        return parseInt(parts[0], radix) + parseInt(parts[1], radix) /
          Math.pow(radix, parts[1].length)
      }
      return parseInt(parts[0], radix)
    },

    getParameterByName(name, url) {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
  },
}

export default mixin