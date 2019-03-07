<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card tomo-card--verify">
            <div class="tomo-card__header">
                <h3 class="tomo-card__headline">Verify and Publish your Solidity Source Code</h3>
                <ul class="list-unstyled">
                    <li class="mb-2">
                        Step 1: Enter your Contract Source Code below.</li>
                    <li class="mb-2">
                        Step 2: If the Bytecode generated matches the existing
                        Creation Address Bytecode, the contract is then Verified.</li>
                    <li class="mb-2">
                        Step 3: Contract Source Code is published online
                        and publicably verifiable by anyone</li>
                </ul>
            </div>
            <div class="tomo-card__body">

                <ul
                    v-if="errors.length"
                    class="alert alert-danger">
                    <li
                        v-for="(error, index) in errors"
                        :key="index">{{ error }}</li>
                </ul>

                <form
                    :class="loadingForm ? 'tomo-loading tomo-loading--form' : ''"
                    novalidate
                    @submit.prevent="validate()">
                    <div class="row">
                        <div class="col-sm-6 col-lg-3">
                            <div class="form-group">
                                <label for="contractAddress">Contract Address *</label>
                                <input
                                    id="contractAddress"
                                    v-model="contractAddress"
                                    :class="getValidationClass('contractAddress')"
                                    type="text"
                                    class="form-control"
                                    placeholder="Contract Address">
                                <div
                                    v-if="$v.contractAddress.$dirty && ! $v.contractAddress.required"
                                    class="text-danger">Contract Address is required</div>
                            </div>
                        </div>
                        <div class="col-sm-6 col-lg-3">
                            <div class="form-group">
                                <label for="contractName">Contract Name *</label>
                                <input
                                    id="contractName"
                                    v-model="contractName"
                                    :class="getValidationClass('contractName')"
                                    type="text"
                                    class="form-control"
                                    placeholder="Contract Name">
                                <div
                                    v-if="$v.contractName.$dirty && ! $v.contractName.required"
                                    class="text-danger">Contract Name is required</div>
                            </div>
                        </div>
                        <div class="col-sm-8 col-lg-4">
                            <div class="form-group">
                                <label for="compiler">Compiler *</label>
                                <b-form-select
                                    v-model="compiler"
                                    :options="compilers"
                                    :class="getValidationClass('compiler')"
                                    class="form-control"/>
                                <div
                                    v-if="$v.compiler.$dirty && ! $v.compiler.required"
                                    class="text-danger">Compiler is required</div>
                            </div>
                        </div>
                        <div class="col-sm-4 col-lg-2">
                            <div class="form-group">
                                <label for="optimization">Optimization *</label>
                                <select
                                    id="optimization"
                                    v-model="optimization"
                                    :class="getValidationClass('optimization')"
                                    class="form-control">
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>
                                <div
                                    v-if="$v.optimization.$dirty && ! $v.optimization.required"
                                    class="text-danger">Optimization is required</div>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="solidityCode">Enter the Solidity Contract Code below *</label>
                        <textarea
                            id="solidityCode"
                            v-model="solidityCode"
                            :class="getValidationClass('solidityCode')"
                            cols="30"
                            rows="10"
                            class="form-control"/>
                        <div
                            v-if="$v.solidityCode.$dirty && ! $v.solidityCode.required"
                            class="text-danger">Solidity Code is required</div>
                    </div>

                    <div class="form-group">
                        <button
                            :disabled="loadingForm"
                            type="submit"
                            class="btn btn-primary mr-1"><i
                                v-if="loadingForm"
                                class="fa fa-cog fa-spin mr-2"/>Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </section>
</template>
<script>
import { validationMixin } from 'vuelidate'
import { required } from 'vuelidate/lib/validators'

export default {
    mixins: [validationMixin],
    data () {
        return {
            compilers: [],
            contractAddress: '',
            contractName: '',
            compiler: '',
            optimization: 0,
            solidityCode: '',
            errors: [],
            loadingForm: false,
            loading: true
        }
    },
    validations: {
        contractAddress: {
            required
        },
        contractName: {
            required
        },
        compiler: {
            required
        },
        optimization: {
            required
        },
        solidityCode: {
            required
        }
    },
    mounted () {
        let self = this

        self.loading = true

        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'contracts-verify', to: { name: 'contracts-verify' } })

        let address = self.$route.query.address
        if (address) {
            self.contractAddress = address
        }

        self.getVersions()

        self.loading = false
    },
    methods: {
        getValidationClass (fieldName) {
            const field = this.$v[fieldName]

            if (field) {
                return field.$error ? 'is-invalid' : ''
            }
        },
        validate () {
            this.$v.$touch()

            if (!this.$v.$invalid) {
                this.submitVerifyContract()
            }
        },
        async getVersions () {
            let self = this
            let { data } = await self.$axios.get('/api/soljsons')

            self.compilers = data.map((version, i) => ({
                value: i,
                text: version.replace('soljson-', '').replace('.js', '')
            }))
            self.compilers.unshift({ value: '', text: '[Please select]' })
        },

        async submitVerifyContract () {
            let self = this

            let body = {
                contractAddress: self.contractAddress,
                contractName: self.contractName,
                sourceCode: self.solidityCode,
                version: self.compiler,
                optimization: self.optimization
            }

            self.errors = []
            self.loadingForm = true
            let { data } = await self.$axios.post('/api/contracts', body)
            if (data.errors) {
                self.errors = data.errors
            } else {
                return self.$router.push({ name: 'address-slug', params: { slug: data.hash } })
            }
            self.loadingForm = false
        }
    }
}
</script>
