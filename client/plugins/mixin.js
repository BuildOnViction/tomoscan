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
            number = new BigNumber(number.toString())
            const seps = number.toString().split('.')
            seps[0] = seps[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            return seps.join('.')
        },

        toLongNumberString: (n) => {
            let str2 = ''
            const data = n.toExponential().replace('.', '').split(/e/i)
            const str = data[0]
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

        toTomo: (wei) => {
            if (isNaN(wei)) {
                return '0'
            }

            if (typeof (wei) !== 'string') {
                wei = wei.toString()
            }

            // Set bignumber config.
            BigNumber.config({ EXPONENTIAL_AT: [-100, 100] })

            let weiNumber = new BigNumber(wei)
            const divided = 10 ** 18

            weiNumber = weiNumber.dividedBy(divided).toString()

            return mixin.methods.formatNumber(weiNumber)
        },

        toTokenQuantity: (wei, decimal) => {
            if (isNaN(wei)) {
                return '0'
            }

            if (typeof (wei) !== 'string') {
                wei = wei.toString()
            }

            // Set bignumber config.
            BigNumber.config({ EXPONENTIAL_AT: [-100, 100] })

            let weiNumber = new BigNumber(wei)
            const divided = 10 ** decimal

            weiNumber = weiNumber.dividedBy(divided).toString()

            return mixin.methods.formatNumber(weiNumber)
        },

        toTomoNumber: (wei) => {
            BigNumber.config({ EXPONENTIAL_AT: [-100, 100] })

            const weiNumber = new BigNumber(wei)
            const divided = 10 ** 18
            return weiNumber.dividedBy(divided).toString()
            // web3.utils.fromWei(wei, 'ether')
        },

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
            let str
            if (number > 10000) {
                str = `Total ${mixin.methods.formatNumber(number)} ${plural} 
                found (Showing the last 10,000 records)`
            } else {
                str = `Total ${mixin.methods.formatNumber(number)} ${number > 1 ? plural : single} found`
            }
            return str
        },

        copySourceCode (e) {
            const id = e.trigger.parentNode.id
            let msg = ''

            if (id === 'code-actions--source') {
                msg = 'Source code copied to clipboard'
            }

            if (id === 'code-actions--abi') {
                msg = 'ABI code copied to clipboard'
            }

            if (id === 'code-actions--creation') {
                msg = 'Contract creation code copied to clipboard'
            }

            this.$toast.show(msg)
        },

        refreshCodeMirror () {
            this.$nextTick(() => {
                if (this.$refs.readSourceCode) {
                    const readSourceCode = this.$refs.readSourceCode
                    for (const $ref in readSourceCode.$refs) {
                        if (Object.prototype.hasOwnProperty.call(readSourceCode.$refs[$ref], 'codemirror')) {
                            readSourceCode.$refs[$ref].codemirror.refresh()
                        }
                    }
                }
            })
        },
        refreshInputTxCodeMirror () {
            this.$nextTick(() => {
                if (this.$refs.readSourceCode) {
                    const readSourceCode = this.$refs.readSourceCode
                    readSourceCode.refresh()
                }
            })
        },
        async filterAddress (filter, tokenType) {
            if (filter) {
                const search = filter.trim()
                let to
                if (tokenType === 'trc20') {
                    to = { name: 'tokens-slug-trc20-holder', params: { slug: this.hash, holder: search } }
                } else if (tokenType === 'trc721') {
                    to = { name: 'tokens-slug-trc721-holder', params: { slug: this.hash, holder: search } }
                } else if (tokenType === 'trc21') {
                    to = { name: 'tokens-slug-trc21-holder', params: { slug: this.hash, holder: search } }
                }
                return this.$router.push(to)
            }
        },
        hiddenString (string, numberStringShowing) {
            if (string === null || string === '') {
                return ''
            }
            if (string.length <= numberStringShowing * 2 + 3) {
                return string
            }
            const stringBeforeDot = String(string).substr(0, numberStringShowing)
            const stringAfterDot = String(string).substr(-numberStringShowing)
            return stringBeforeDot + '...' + stringAfterDot
        },

        checkAvatarExist: function (branch, token) {
            const url = 'https://raw.githubusercontent.com/tomochain/tokens/' + branch +
                '/tokens/' + token.toLowerCase() + '.png'
            const xhr = new XMLHttpRequest()
            xhr.open('HEAD', url, false)
            xhr.send()

            if (xhr.status === 404) {
                return false
            } else {
                return true
            }
        }
    }
}

export default mixin
