<template>
  <div
    v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
  <div
    v-else
    class="tomo-contract-info">

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
                @click="callFunction(func.name, func.name + '_' + index, 'output_' + func.name + '_' + index, func.outputs[0].type)">Call</button>
            </div>
            <div
              class="tomo-contract-info__outputs"
              v-if="func.outputs.length">
              <span>
                <em>{{ func.outputs[0].type }}</em>
                <span :id="'output_' + func.name + '_' + index"></span>
              </span>
            </div>
          </td>
      </tr>
    </table>
  </div>
</template>

<script>
export default {
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
    callFunction (functionName, inputElement, outputElement, outputType) {
    }
  }
}
</script>

