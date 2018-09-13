<template>
    <b-modal
        ref="modalForgotPw"
        :id="modalId"
        class="tomo-modal"
        title="Password Recovery"
        ok-only
        ok-title="Submit"
        data-toggle="modal"
        target="successModal"
        @ok="validate"
        @keydown.native.enter="validate">
        <div
            v-if="errorMessage"
            class="alert alert-danger">
            {{ errorMessage }}
        </div>
        <form
            novalidate
            @submit.prevent="validate()">
            <div class="form-group">
                <label class="control-label">Email:</label>
                <input
                    v-model="formEmail"
                    :class="getValidationClass('formEmail')"
                    name="email"
                    type="email"
                    autocomplete="email"
                    class="form-control"
                    placeholder="Enter email">
                <div
                    v-if="$v.formEmail.$dirty && ! $v.formEmail.required"
                    class="text-danger">Email is required</div>
                <div
                    v-if="$v.formEmail.$dirty && ! $v.formEmail.email"
                    class="text-danger text-block">Please enter email format</div>
                <div
                    class="mt-4">
                    <vue-recaptcha
                        ref="recaptcha"
                        :sitekey="reCaptchaKey"
                        @verify="onCaptchaVerified"
                        @expired="onCaptchaExpired"/>
                </div>
            </div>
        </form>
    </b-modal>
</template>
<script>
import { validationMixin } from 'vuelidate'
import { required, email } from 'vuelidate/lib/validators'
import VueRecaptcha from 'vue-recaptcha'

export default {
    components: {
        VueRecaptcha
    },
    mixins: [validationMixin],
    props: {
        modalId: {
            type: String,
            default: ''
        }
    },
    data () {
        return {
            formEmail: '',
            errorMessage: null,
            reCaptchaKey: process.env.RECAPTCHA_SITEKEY
        }
    },
    validations: {
        formEmail: {
            required, email
        }
    },
    methods: {
        getValidationClass (fieldName) {
            const field = this.$v[fieldName]

            if (field) {
                return field.$error ? 'is-invalid' : ''
            }
        },
        validate (e) {
            e.preventDefault()

            this.$v.$touch()

            if (!this.$v.$invalid) {
                this.findPassword()
            }
        },
        created () {
            const self = this
            self.reCaptchaKey = process.env.RECAPTCHA_SITEKEY
        },
        async findPassword () {
            let self = this

            const email = self.formEmail
            const captchaToken = self.recaptchaToken
            try {
                const response = await self.$store.dispatch('user/forgotPassword', { email, captchaToken })

                if (response.error) {
                    self.errorMessage = response.error.message
                } else {
                    self.$refs.modalForgotPw.hide()
                    self.resetModal()
                    self.$router.replace({ name: 'accounts-forgot-password-confirmation', params: { email } })
                }
            } catch (e) {
                if (e.response.data.message) {
                    self.errorMessage = e.response.data.message
                }
            }
        },
        resetModal () {
            this.formEmail = ''
            this.errorMessage = ''
            this.$refs.recaptcha.reset()
            this.$v.$reset()
        },
        onCaptchaVerified (recaptchaToken) {
            const self = this
            self.recaptchaToken = recaptchaToken
            self.errorMessage = ''
        },
        onCaptchaExpired () {
            this.$refs.recaptcha.reset()
            self.recaptchaToken = null
        }
    }
}
</script>
