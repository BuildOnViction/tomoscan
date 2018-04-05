<template>
	<v-layout row justify-center hidden>
		<v-btn small @click="onUpdatePagination('first')">{{ config.first_button_text }}</v-btn>
		<v-btn small color="primary" @click="onUpdatePagination('prev')">{{ config.prev_button_text }}</v-btn>
		<v-btn depressed small>Page {{ formatNumber(current_page) }} -> {{ formatNumber(last_page) }}</v-btn>
		<v-btn small color="primary" @click="onUpdatePagination('next')">{{ config.next_button_text }}</v-btn>
		<v-btn small @click="onUpdatePagination('last')">{{ config.last_button_text }}</v-btn>
	</v-layout>
</template>

<script>
  import _ from 'lodash'
  import mixin from '~/plugins/mixin'

  export default {
    mixins: [mixin],
    props: {
      current_page: {
        type: Number,
        require: true,
        default: 1,
      },
      last_page: {
        type: Number,
        require: true,
      },
      options: {
        type: Object,
        require: false,
      },
    },
    watch: {
      current_page (val) {
        if (val != this.page) {
          this.page = val
        }

        return val
      },
    },
    data: () => ({
      first: 1,
      config: {
        prev_button_text: 'Prev',
        next_button_text: 'Next',
        last_button_text: 'Last',
        first_button_text: 'First',
      },
    }),
    mounted () {
      this.config = _.merge(this.config, this.options)
      this.page = this.current_page
    },
    methods: {
      onUpdatePagination (type) {
        switch (type) {
          case 'first':
            this.page = 1
            break
          case 'prev':
            this.page = this.page - 1 > 1 ? this.page - 1 : 1
            break
	        case 'next':
	          this.page = this.page + 1 < this.last_page ? this.page + 1 : this.last_page
	          break
	        case 'last':
	          this.page = this.last_page
	          break
        }

        this.$emit('update-pagination', {page: this.page})
      },
    },
  }
</script>