<template>
    <b-modal
        ref="modalRegister"
        :id="modalId"
        class="tomo-modal"
        title="Register"
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
                    :class="getValidationClass(formEmail)"
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
            <div class="form-group">
                <label class="control-label">Password:</label>
                <input
                    v-model="formPassword"
                    :class="getValidationClass(formPassword)"
                    name="password"
                    type="password"
                    autocomplete="new-password"
                    class="form-control"
                    placeholder="Enter your password">
                <div
                    v-if="$v.formPassword.$dirty && ! $v.formPassword.required"
                    class="text-danger">Password is required</div>
                <div
                    v-if="$v.formPassword.$dirty && ! $v.formPassword.minLength"
                    class="text-danger">Password require min 6 characters</div>
            </div>
            <div class="form-group">
                <label class="control-label">Password Confirmation:</label>
                <input
                    v-model="formPasswordConfirmation"
                    :class="getValidationClass(formPasswordConfirmation)"
                    name="password_confirmation"
                    type="password"
                    autocomplete="new-password"
                    class="form-control"
                    placeholder="Enter your password confirmation">
                <div
                    v-if="$v.formPassword.$dirty && ! $v.formPassword.required"
                    class="text-danger">Password is required</div>
                <div
                    v-if="$v.formPasswordConfirmation.$dirty && ! $v.formPasswordConfirmation.sameAsPassword"
                    class="text-danger">Those passwords didn't match</div>
            </div>
        </form>
    </b-modal>
</template>
<script>
import { validationMixin } from 'vuelidate'
import { required, sameAs, minLength, email } from 'vuelidate/lib/validators'

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
            formPassword: '',
            formPasswordConfirmation: '',
            errorMessage: null
        }
    },
    validations: {
        formEmail: {
            required,
            email
        },
        formPassword: { required, minLength: minLength(6) },
        formPasswordConfirmation: {
            required,
            sameAsPassword: sameAs('formPassword')
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
                this.register()
            }
        },
        async register () {
            let self = this

            const email = self.formEmail
            const password = self.formPassword

            try {
                await self.$store.dispatch('user/register', { email, password })

                // Close modal.
                self.$refs.modalRegister.hide()
                self.resetModal()
            } catch (e) {
                if (e.response.data.message) {
                    self.errorMessage = e.response.data.message
                }
            }
        },
        resetModal () {
            this.formEmail = ''
            this.formPassword = ''
            this.formPasswordConfirmation = ''
            this.$v.$reset()
        }
    }
}
</script>
