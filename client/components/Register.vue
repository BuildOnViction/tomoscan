<template>
	<b-modal
		:id="modalId"
		ref="modalRegister"
		@ok="onRegister"
		@keydown.native.enter="onRegister"
		title="Register">
		<div class="alert alert-danger" v-show="errorMessage">
			{{ errorMessage }}
		</div>
		<form>
			<div class="form-group">
				<label class="control-label">Email:</label>
				<input v-model="formEmail"
				       @input="$v.formEmail.$touch()"
				       :class="($v.formEmail.$dirty && $v.formEmail.$invalid) ? 'is-invalid' : ''"
				       name="email" type="email" autocomplete="email" class="form-control" required placeholder="Enter email">
				<div class="text-danger" v-if="$v.formEmail.$dirty && ! $v.formEmail.required">Email is required</div>
				<div class="text-danger text-block" v-if="$v.formEmail.$dirty && ! $v.formEmail.email">Please enter email format</div>
			</div>
			<div class="form-group">
				<label class="control-label">Password:</label>
				<input v-model="formPassword"
				       @input="$v.formPassword.$touch()"
				       :class="($v.formPassword.$dirty && $v.formPassword.$invalid) ? 'is-invalid' : ''"
				       name="password" type="password" autocomplete="new-password" class="form-control" required placeholder="Enter your password">
				<div class="text-danger" v-if="$v.formPassword.$dirty && ! $v.formPassword.required">Password is required</div>
				<div class="text-danger" v-if="$v.formPassword.$dirty && ! $v.formPassword.minLength">Password require min 6 characters</div>
			</div>
			<div class="form-group">
				<label class="control-label">Password Confirmation:</label>
				<input v-model="formPasswordConfirmation"
				       @input="$v.formPasswordConfirmation.$touch()"
				       :class="($v.formPasswordConfirmation.$dirty && $v.formPasswordConfirmation.$invalid) ? 'is-invalid' : ''"
				       name="password_confirmation" type="password" autocomplete="new-password" class="form-control" required placeholder="Enter your password confirmation">
				<div class="text-danger" v-if="$v.formPassword.$dirty && ! $v.formPassword.required">Password is required</div>
				<div class="text-danger" v-if="$v.formPasswordConfirmation.$dirty && ! $v.formPasswordConfirmation.sameAsPassword">Repeat password again</div>
			</div>
		</form>
	</b-modal>
</template>
<script>
  import { validationMixin, withParams } from 'vuelidate'
  import { required, sameAs, minLength, email } from 'vuelidate/lib/validators'

  export default {
    mixins: [validationMixin],
    props: {
      modalId: String,
    },
    data () {
      return {
        formEmail: '',
        formPassword: '',
        formPasswordConfirmation: '',
        errorMessage: null,
      }
    },
    validations: {
      formEmail: {
        required, email,
      },
      formPassword: {required, minLength: minLength(6)},
      formPasswordConfirmation: {
        required,
        sameAsPassword: sameAs('formPassword'),
      },
    },
    methods: {
      async onRegister (e) {
        let self = this
        e.preventDefault()

        if (this.$v.$error) {
          return
        }

        const email = self.formEmail
        const password = self.formPassword

        self.$store.dispatch('user/register', {email, password}).then((data) => {
          self.resetModal()

          // Close modal.
          self.$refs.modalRegister.hide()
        }).catch((e) => {
          self.errorMessage = e.message
        })
      },
      resetModal () {
        this.formEmail = ''
        this.formPassword = ''
        this.formPasswordConfirmation = ''
        this.errorMessage = ''
      },
    },
  }
</script>