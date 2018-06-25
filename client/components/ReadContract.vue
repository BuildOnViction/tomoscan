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
      <a href="#"><i class="fa fa-refresh ml-5 mr-1"></i>Reset</a>
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
                @click="callFunction(func.name, func.name + '_' + index, 'output_' + func.name + '_' + index, getOuputFieldTypes)">Call</button>
            </div>
            <div
              class="tomo-contract-info__outputs"
              v-if="func.outputs.length">
              <span
                v-for="(output, idx2) in func.outputs"
                :key="idx2">
                <em>{{ output.type }}</em>
                <span :id="'output_' + func.name + '_' + index"></span>
              </span>
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
    async callFunction (functionName, inputElement, outputElement) {
      let hash = this.$route.params.slug
      let params = {
        functionName: functionName
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
      let {data} = await this.$axios.get('/api/contracts/' + hash + '/call/?' + query)

      console.log(data)
    },
    add0xforAddress(straddress) {
      straddress = straddress.trim();
      if (straddress.startsWith('0x') == false && straddress.length == 40) {
          straddress = '0x' + straddress;
      }
      return straddress;
    },
    formatOuputs(output, outputFieldNames) {
      let answer = ''

      if(outputFieldNames.includes(';')) {
        let res_2 = outputFieldNames.split(';')

        for(let i = 0; i < output.length; i++) {
          var tmpArray = res_2[i].toString().split('|')
          answer = answer + '&nbsp;<font color="green"><i class="fa fa-angle-double-right"></i></font> ';
          
          // if(res_2[i] !== null)
        }
      } else {
        answer = answer + "&nbsp;<font color='green'><i class='fa  fa-angle-double-right'></i></font> ";
      }

      return answer
    }
  }
}
</script>

