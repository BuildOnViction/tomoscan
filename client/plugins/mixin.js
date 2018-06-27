import web3 from 'web3'
import BigNumber from 'bignumber.js'

const mixin = {
    methods: {
        serializeQuery: (params, prefix) => {
            const query = Object.keys(params).map((key) => {
                const value = params[key]

                if (params.constructor === Array) {
                    key = `${prefix}[]`
                } else {
                    if (params.constructor === Object) {
                        key = (prefix ? `${prefix}[${key}]` : key)
                    }
                }

                return value === 'object' ? this.serializeQuery(value, key) : `${key}=${encodeURIComponent(value)}`
            })

            return [].concat.apply([], query).join('&')
        },

        formatNumber: (number) => {
            let seps = number.toString().split('.')
            seps[0] = seps[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

            return seps.join('.')
        },

        toLongNumberString: (n) => {
            let str; let str2 = ''; let data = n.toExponential().replace('.', '').split(/e/i)
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
            if (isNaN(wei)) {
                return '0'
            }

            if (typeof (wei) !== 'string') {
                wei = wei.toString()
            }

            // Set bignumber config.
            BigNumber.config({ EXPONENTIAL_AT: [-100, 100] })

            let weiNumber = new BigNumber(wei)
            let sfx = ''
            let divided = 10 ** 18
            if (weiNumber.gte(10 ** 30)) {
                sfx = '<strong>T</strong>'
                divided = 10 ** 30
            }

            weiNumber = weiNumber.dividedBy(divided).toString()

            return mixin.methods.formatNumber(weiNumber) + ' ' + sfx
        },

        toEtherNumber: (wei) => web3.utils.fromWei(wei, 'ether'),

        unformatAddress: (address) => address.replace(
            '0x000000000000000000000000', '0x'),

        convertHexToInt: (hex) => parseInt(hex),

        trimWord: (word) => word.replace(/^\s+|\s+$|\s+(?=\s)/g, '')
            .replace('\t', '')
            .replace(/\u0000/g, '') // eslint-disable-line no-control-regex
            .trim(),

        formatUnit: (number, unit = null) => number + ' ' +
      mixin.methods.baseUnit(unit),

        toGwei: (wei) => wei ? mixin.methods.formatNumber(web3.utils.fromWei(wei,
            'gwei')) : '',

        baseUnit: (baseUnit) => {
            baseUnit = baseUnit || process.env.BASE_UNIT

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

        getParameterByName: (name, url) => {
            if (!url) url = window.location.href
            name = name.replace(/[[\]]/g, '\\$&')
            var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')

            var results = regex.exec(url)
            if (!results) return null
            if (!results[2]) return ''
            return decodeURIComponent(results[2].replace(/\+/g, ' '))
        },

        _nFormatNumber: (single, plural, number) => {
            let str = mixin.methods.formatNumber(number) + ' '
            str += number > 1 ? plural : single
            return str
        }
    }
}

export default mixin
