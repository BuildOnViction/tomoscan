<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <div
        v-else
        class="card tomo-card tomo-card--contract-info">

        <div
            v-if="data.length == 0"
            class="tomo-empty">
            <i class="fa fa-book tomo-empty__icon"/>
            <p class="tomo-empty__description">Can not read this smart contract</p>
        </div>

        <div class="tomo-card__header mb-3">
            <h6 class="d-md-inline-block"><i class="fa fa-book mr-2"/>Read Contract Information</h6>
            <a
                href="#"
                class="ml-md-5"
                @click="resetInput"><i class="fa fa-refresh mr-1"/>Reset</a>
        </div>

        <table class="tomo-card__table tomo-contract-info">
            <tr
                v-for="(func, index) in data"
                :key="index">
                <td :class="`tomo-contract-info__func ${func.inputs.length ? 'with-input' : 'no-input'}`">
                    <span class="tomo-contract-info__name">
                        {{ index + 1 }}. <i class="fa fa-caret-right"/> {{ func.name }}&nbsp;
                    </span>
                    <i
                        v-if="typeof func.result !== 'undefined' && ! func.inputs.length"
                        class="fa fa-long-arrow-right ml-2 mr-2"/>
                    <span
                        v-if="typeof func.result !== 'undefined' && ! func.inputs.length"
                        class="tomo-contract-info__result">
                        <nuxt-link
                            v-if="func.outputs[0].type === 'address'"
                            :to="{name: 'address-slug', params: {slug: func.result}}"
                            class="text-truncate">{{ func.result }}
                        </nuxt-link>
                        <span v-else>
                            {{ func.result === '' ? '\'\'' : func.result }}
                        </span>
                        <em class="tomo-contract-info__type">{{ func.outputs[0].type }}</em>
                    </span>
                    <div
                        v-if="func.inputs.length"
                        class="tomo-contract-info__inputs">
                        <input
                            v-for="(input, idx) in func.inputs"
                            :key="idx"
                            :name="input.name"
                            :placeholder="input.name + '(' + input.type + ')'"
                            :class="'form-control mr-2 ' + func.name + '_' + index"
                            type="text">
                        <button
                            class="btn btn-primary"
                            type="button"
                            @click="callFunction(func.name, func.signature,
                                                 func.name + '_' + index,
                                                 'output_' + func.name + '_' + index)">Call</button>
                    </div>
                    <div
                        v-if="func.outputs.length && typeof func.result == 'undefined'"
                        class="tomo-contract-info__outputs">
                        <i class="fa fa-angle-double-right"/>
                        <span
                            v-for="(output, idx2) in func.outputs"
                            :key="idx2">
                            <span class="tomo-contract-info__param-name">{{ output.name }}</span>
                            <em class="tomo-contract-info__type">{{ output.type }}</em>
                            <span v-show="idx2 < func.outputs.length - 1">, </span>
                        </span>
                        <div
                            :id="'output_' + func.name + '_' + index"
                            class="tomo-contract-info__result"/>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
import mixin from '~/plugins/mixin'
export default {
    mixins: [mixin],
    props: {
        contract: {
            type: String,
            default: ''
        }
    },
    data: () => ({
        loading: true,
        data: null
    }),
    async mounted () {
        this.getDataFromApi()
    },
    methods: {
        async getDataFromApi () {
            let self = this

            self.loading = true

            let { data } = await this.$axios.get('/api/contracts/' + self.contract + '/read')
            self.data = data

            self.loading = false
        },
        async callFunction (functionName, signature, inputElement, outputElement) {
            let params = {
                functionName: functionName,
                signature: signature
            }

            let strParams = ''
            let elements = document.querySelectorAll('.' + inputElement)

            for (let i = 0; i < elements.length; i++) {
                if (i === 0) {
                    strParams = this.add0xforAddress(elements[0].value)
                } else {
                    strParams = strParams + ',' + elements[i].value
                }

                if (elements[i].value === '') {
                    document.getElementsByClassName(inputElement)[0].focus()
                    alert('Input value cannot be empty')
                    return false
                }
            }

            params.strParams = strParams

            let query = this.serializeQuery(params)
            let output = await this.$axios.get('/api/contracts/' + this.contract + '/call/?' + query)

            document.getElementById(outputElement).innerHTML =
                `<div class="tomo-contract-info__response">
                <p>[<strong>${functionName}</strong> method response]</p>${this.formatOuputs(output.data)}</div>`
        },
        add0xforAddress (straddress) {
            straddress = straddress.trim()
            if (!straddress.startsWith('0x') && straddress.length === 40) {
                straddress = '0x' + straddress
            }
            return straddress
        },
        formatOuputs (output) {
            let response = ''

            for (let i = 0; i < output.length; i++) {
                response += '<p>'
                response += `<i class="response${output[i].name === 'Error' ? '--error' : '--success'}"></i>&nbsp;`
                response += `<strong>${output[i].name}</strong>&nbsp;
                    <em class="tomo-contract-info__type">${output[i].type}</em> :
                    <span>${this.formatResult(output[i].value, output[i].type)}</span>`
                response += '</p>'
            }
            return response
        },
        formatResult (strResult, resulttype) {
            if (resulttype.startsWith('uint')) {
                return this.formatNumber(strResult)
            } else if (resulttype === 'string') {
                return strResult
            } else if (resulttype === 'address') {
                return "<a href='/address/" + strResult + "'>" + strResult + '</a>'
            } else {
                return strResult
            }
        },
        resetInput (e) {
            e.preventDefault()
            let inputs = document.querySelectorAll('.tomo-contract-info input')
            let ouputs = document.querySelectorAll('.tomo-contract-info__func.with-input .tomo-contract-info__result')

            for (let i = 0; i < inputs.length; i++) {
                inputs[i].value = ''
            }

            for (let i = 0; i < ouputs.length; i++) {
                ouputs[i].innerHTML = ''
            }
        }
    }
}
</script>
