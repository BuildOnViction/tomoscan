<template>
    <b-modal
        ref="modalForgotPw"
        :id="modalId"
        class="tomo-modal"
        title="Password Recovery"
        ok-only
        ok-title="LOL"
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
            </div>
        </form>
    </b-modal>
</template>
<script>
import { validationMixin } from 'vuelidate'
import { required, email } from 'vuelidate/lib/validators'

export default {
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
            errorMessage: null
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
        async findPassword () {
            let self = this

            const email = self.formEmail
            try {
                const data = await self.$store.dispatch('user/forgotPassword', { email })
                if (!data) {
                    self.errorMessage = 'Something went wrong. Please check again.'
                } else {
                    alert('Your password have been sent to you by email. You will now be returned to where you were.')
                    self.$refs.modalForgotPw.hide()
                    self.resetModal()
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
            this.$v.$reset()
        }
    }
}
</script>
