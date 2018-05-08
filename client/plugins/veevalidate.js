import Vue from 'vue'
import VeeValidate from 'vee-validate'
import { Validator } from 'vee-validate'

Validator.extend('test', {
  getMessage: field => `The ${field} value is not eth address format.`,
  validate: value => /^(0x)?[0-9a-f]{40}$/.test(value),
})

let config = {
  aria: true,
  errorBagName: 'errors', // change if property conflicts.
  fieldsBagName: 'formFields ', //Default is fields
  inject: 'false',
}
Vue.use(VeeValidate, config)