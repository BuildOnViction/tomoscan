<template>
	<b-modal
		:id="modalId"
		ref="modalRegister"
		@ok="onLogin"
		@keydown.native.enter="onLogin"
		title="Register">
		<div class="alert alert-danger" v-show="errorMessage">
			{{ errorMessage }}
		</div>
		<div>
			<div class="form-group">
				<label class="control-label">Email:</label>
				<input v-model="form.email"
				       v-validate="'required|email'"
				       data-vv-as="Email"
				       name="email" type="email" class="form-control" required placeholder="Enter email">
				<span class="text-danger" v-show="errors.has('email')">{{ errors.first('email') }}</span>
			</div>
			<div class="form-group">
				<label class="control-label">Password:</label>
				<input v-model="form.password"
				       v-validate="'required'"
				       data-vv-as="Password"
				       name="password" type="password" class="form-control" required placeholder="Enter your password">
				<span class="text-danger" v-show="errors.has('password')">{{ errors.first('password') }}</span>
			</div>
		</div>
	</b-modal>
</template>
<script>
  export default {
    props: {
      modalId: String,
    },
    data () {
      return {
        form: {
          email: '',
          password: '',
        },
        errorMessage: null,
      }
    },
    methods: {
      async onLogin (e) {
        let self = this
        e.preventDefault()

        let result = await self.$validator.validateAll()
        if (!result) {
          return
        }

        const email = self.form.email
        const password = self.form.password

        self.$store.dispatch('user/login', {email, password}).then((data) => {
          self.resetModal()

          // Close modal.
          self.$refs.modalRegister.hide()
        }).catch((e) => {
          self.errorMessage = e.message
        })
      },
      resetModal () {
        this.form.email = ''
        this.form.password = ''
        this.errorMessage = ''
      },
    },
  }
</script>