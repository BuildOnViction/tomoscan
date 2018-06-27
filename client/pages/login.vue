<template>
    <section>
        <div class="container">
            <b-row>
                <b-col
                    md="6"
                    offset-md="3">
                    <div
                        v-show="errorMessages"
                        class="alert alert-danger">
                        <ul class="list-unstyled">
                            <li
                                v-for="(error, key) in errorMessages"
                                :key="key">
                                {{ key }}: {{ error.message }}</li>
                        </ul>
                    </div>
                    <form
                        @submit.prevent="onRegister"
                        @reset="onReset">
                        <div class="form-group">
                            <label class="control-label">Email:</label>
                            <input
                                v-validate="'required|email'"
                                v-model="form.email"
                                data-vv-as="Email"
                                name="email"
                                type="email"
                                autocomplete="email"
                                class="form-control"
                                required
                                placeholder="Enter email">
                            <span
                                v-show="errors.has('email')"
                                class="text-danger">{{ errors.first('email') }}</span>
                        </div>
                        <div class="form-group">
                            <label class="control-label">Password:</label>
                            <input
                                v-validate="'required|confirmed'"
                                v-model="form.password"
                                data-vv-as="Password"
                                name="password"
                                type="password"
                                autocomplete="new-password"
                                class="form-control"
                                required
                                placeholder="Enter your password">
                            <span
                                v-show="errors.has('password')"
                                class="text-danger">{{ errors.first('password') }}</span>
                        </div>

                        <b-button
                            type="submit"
                            variant="primary"
                            class="mr-1">Login</b-button>
                        <b-button
                            type="reset"
                            variant="danger">Reset</b-button>
                    </form>
                </b-col>
            </b-row>
        </div>
    </section>
</template>
<script>
export default {}
</script>
