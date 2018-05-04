<template>
	<section>
		<div class="container">
			<b-row>
				<b-col md="6" offset-md="3">
					<div class="alert alert-danger" v-show="errorMessages">
						<ul class="list-unstyled">
							<li v-for="error, key in errorMessages">{{ key }}: {{ error.message }}</li>
						</ul>
					</div>
					<form @submit.prevent="onRegister" @reset="onReset">
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
							       v-validate="'required|confirmed'"
							       data-vv-as="Password"
							       name="password" type="password" class="form-control" required placeholder="Enter your password">
							<span class="text-danger" v-show="errors.has('password')">{{ errors.first('password') }}</span>
						</div>

						<b-button type="submit" variant="primary" class="mr-1">Login</b-button>
						<b-button type="reset" variant="danger">Reset</b-button>
					</form>
				</b-col>
			</b-row>
		</div>
	</section>
</template>
<script>
  export default {}
</script>