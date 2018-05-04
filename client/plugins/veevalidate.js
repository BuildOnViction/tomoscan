import Vue from 'vue'
import VeeValidate from 'vee-validate'

let config = {
  aria: true,
  errorBagName: 'errors', // change if property conflicts.
  fieldsBagName: 'formFields ', //Default is fields
  inject: 'false',
}
Vue.use(VeeValidate, config)