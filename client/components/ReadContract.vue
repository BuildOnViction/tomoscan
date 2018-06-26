<template>
  <div
    v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
  <div
    v-else
    class="card tomo-card tomo-contract-info">

    <div
      v-if="data.length == 0"
      class="tomo-empty">
        <i class="fa fa-book tomo-empty__icon"></i>
        <p class="tomo-empty__description">Can not read this smart contract</p>
    </div>

    <div class="tomo-contract-info__title mb-3">
      <span><i class="fa fa-book mr-1"></i>Read Contract Information</span>
      <a href="#" @click="resetInput"><i class="fa fa-refresh ml-5 mr-1"></i>Reset</a>
    </div>

    <table class="tomo-contract-info__table">
      <tr v-for="(func, index) in data"
          :key="index">
          <td>
            <span class="tomo-contract-info__func">{{ index + 1 }}. {{ func.name }}&nbsp;</span>
            <i class="fa fa-long-arrow-right ml-2 mr-2"></i>
            <span
              v-if="func.constant && ! func.inputs.length"
              class="tomo-contract-info__value">
              <nuxt-link
                v-if="func.outputs[0].type === 'address'"
                class="text-truncate"
                :to="{name: 'address-slug', params: {slug: func.result.toLowerCase()}}">{{ func.result.toLowerCase() }}
              </nuxt-link>
              <span v-else>
                {{ func.result }}
              </span>
              <em class="ml-1">{{ func.outputs[0].type }}</em>
            </span>
            <div
              class="tomo-contract-info__inputs"
              v-if="func.inputs.length">
              <input
                v-for="(input, idx) in func.inputs"
                :key="idx"
                :name="input.name"
                :placeholder="input.name + '(' + input.type + ')'"
                :class="'mr-2 ' + func.name + '_' + index"
                type="text"/>
              <button
                class="btn btn-primary"
                type="button"
                @click="callFunction(func.name, func.signature, func.name + '_' + index, 'output_' + func.name + '_' + index)">Call</button>
            </div>
            <div
              class="tomo-contract-info__outputs"
              v-if="func.outputs.length">
              <span
                v-for="(output, idx2) in func.outputs"
                :key="idx2">{{ output.name }}<em class="ml-1">{{ output.type }}</em>
                {{ (idx2 < func.outputs.length - 1 ) ? ',' : '' }}
              </span>
              <span :id="'output_' + func.name + '_' + index"></span>
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
      let hash = self.$route.params.slug

    self.loading = true

      let {data} = await this.$axios.get('/api/contracts/' + hash + '/read')
      self.data = data

      self.loading = false
    },
    async callFunction (functionName, signature, inputElement, outputElement) {
      let hash = this.$route.params.slug
      let params = {
        functionName: functionName,
        signature: signature
      }

      let strParams = ''
      let elements = document.querySelectorAll('.' + inputElement)
      
      for (let i = 0; i < elements.length; i++) {
        if (i == 0) {
          strParams = "'" + this.add0xforAddress(elements[0].value) + "'"
        } else {
          strParams = strParams + ",'" + elements[i].value + "'"
        }

        if (elements[i].value == '') {
          document.getElementsByClassName(inputElement)[0].focus();
          alert('Input value cannot be empty');
          return false;
        }
      }

      params.strParams = strParams

      let query = this.serializeQuery(params)
      let output = await this.$axios.get('/api/contracts/' + hash + '/call/?' + query)

      document.getElementById(outputElement).innerHTML = `<br><br> [&nbsp;<b>${functionName}</b> method response]<br>${this.formatOuputs(output.data)}<br>`
    },
    add0xforAddress(straddress) {
      straddress = straddress.trim();
      if (straddress.startsWith('0x') == false && straddress.length == 40) {
          straddress = '0x' + straddress;
      }
      return straddress;
    },
    formatOuputs(output) {
      let response = ''

      for (let i = 0; i < output.length; i++) {
        response += `<i class="fa fa-angle-double-right ${output[i].name=='Error' ? 'text-danger' : 'text-success'}"></i>&nbsp;`
        response += `<strong>${output[i].name}</strong>&nbsp;<em>${output[i].type}</em> : <span>${this.formatResult(output[i].value, output[i].type)}</span><br>`
      }
      return response
    },
    formatResult(strResult, resulttype) {
      if (resulttype.startsWith('uint')) {
        return this.formatNumber(strResult)
      } else if (resulttype == 'string') {
        return strResult
      } else if (resulttype == 'address') {
        if (strResult != '0x0000000000000000000000000000000000000000') {
            return "<a href='/address/" + strResult + "'>" + strResult + "</a>"
        } else {
            return strResult
        }
      } else {
          return strResult
      }
    },
    resetInput(e) {
      e.preventDefault()
      document.querySelectorAll('.tomo-contract-info__func input').innerHTML = ''
    }
  }
}
</script>

