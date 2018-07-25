'use strict'


let TokenHelper = {
    getTokenFuncs: async () => ({
        'decimals': '0x313ce567', // hex to decimal
        'symbol': '0x95d89b41', // hex to ascii
        'totalSupply': '0x18160ddd',
        'name': '0x06fdde03'
    }),

    checkIsToken:async (code) => {
        let tokenFuncs = this.getTokenFuncs()
        let isToken = false
        for (let name in tokenFuncs) {
            let codeCheck = tokenFuncs[name]
            codeCheck = codeCheck.replace('0x', '')
            if (code.indexOf(codeCheck) >= 0) {
                isToken = true
            }
        }

        return isToken
    },
}

export default TokenHelper