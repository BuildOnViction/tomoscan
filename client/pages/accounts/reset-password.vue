<template>
    <b-row>
        <b-col />
        <b-col>
            <div
                v-show="errorMessage"
                class="alert alert-danger">
                {{ errorMessage }}
            </div>
            <form
                novalidate
                @submit.prevent="validate()">
                <div class="form-group">
                    <label class="control-label">New password:</label>
                    <input
                        v-model="formPassword"
                        :class="getValidationClass(formPassword)"
                        name="password"
                        type="password"
                        autocomplete="new-password"
                        class="form-control"
                        placeholder="Enter your new password">
                    <div
                        v-if="$v.formPassword.$dirty && ! $v.formPassword.required"
                        class="text-danger">Password is required</div>
                    <div
                        v-if="$v.formPassword.$dirty && ! $v.formPassword.minLength"
                        class="text-danger">Password require min 6 characters</div>
                </div>
                <div class="form-group">
                    <label class="control-label">Reenter password:</label>
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
                <div class="mt-2">
                    <b-button
                        type="submit"
                        variant="primary"
                        class="btn btn-primary mr-4">OK</b-button>
                    <b-button
                        type="reset"
                        variant="secondary"
                        color="white"
                        @click="resetFields">Reset</b-button>
                </div>
            </form>
        </b-col>
        <b-col />
    </b-row>
</template>

<script>
import { required, sameAs, minLength } from 'vuelidate/lib/validators'
export default {
    props: {
        modalId: {
            type: String,
            default: ''
        }
    },
    data () {
        return {
            formPassword: '',
            formPasswordConfirmation: '',
            errorMessage: null,
            token: '',
            email: ''

        }
    },
    validations: {
        formPassword: { required, minLength: minLength(6) },
        formPasswordConfirmation: {
            required,
            sameAsPassword: sameAs('formPassword')
        }
    },
    head () {
        return {
            title: 'Reset Password'
        }
    },
    async mounted () {
        const self = this
        const token = this.$route.query.token || ''
        const email = this.$route.query.email || ''
        // validate token
        try {
            await self.$store.dispatch('user/tokenValidation', { email, token })
        } catch (error) {
            console.log(error)
        }
        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'reset-password', to: { name: 'reset-password' } })
    },
    methods: {
        getValidationClass (fieldName) {
            const field = this.$v[fieldName]

            if (field) {
                return field.$error ? 'is-invalid' : ''
            }
        },
        resetFields () {
            this.formPassword = ''
            this.formPasswordConfirmation = ''
            this.errorMessage = ''
        },
        validate (e) {
            this.$v.$touch()

            if (!this.$v.$invalid) {
                this.resetPassword()
            }
        },
        async resetPassword () {
            const self = this
            const password = this.formPassword

            const token = this.$route.query.token || ''
            const email = this.$route.query.email || ''
            try {
                const response = await self.$store.dispatch('user/resetpassword', {
                    email,
                    password,
                    token
                })
                if (response.data.error) {
                    self.errorMessage = response.data.error.message
                } else {
                    self.resetFields()
                    self.$router.push({ name: 'accounts-reset-pw-successful' })
                }
            } catch (error) {
                console.log(error)
            }
        }
    }
}
</script>

<style scoped>

</style>
