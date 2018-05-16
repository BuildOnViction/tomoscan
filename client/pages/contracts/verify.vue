<template>
	<section>
		<div class="card">
			<div class="card-body">
				<h5 class="card-title">Verify and Publish your Solidity Source Code</h5>
				<p>Step 1: Enter your Contract Source Code below.</p>
				<p>Step 2: If the Bytecode generated matches the existing Creation Address Bytecode, the contract is then Verified.</p>
				<p>Step 3: Contract Source Code is published online and publicably verifiable by anyone</p>
				<hr>

				<div class="row">
					<div class="col-sm-3">
						<div class="form-group">
							<label for="contractAddress">Contract Address:</label>
							<input
								v-model="formContractAddress"
								@input="$v.formContractAddress.$touch()"
								:class="($v.formContractAddress.$dirty && $v.formContractAddress.$invalid) ? 'is-invalid' : ''"
								type="text" class="form-control" id="contractAddress" placeholder="Contract Address">
							<div class="text-danger" v-if="$v.formContractAddress.$dirty && ! $v.formContractAddress.required">Contract Address is required</div>
						</div>
					</div>
					<div class="col-sm-3">
						<div class="form-group">
							<label for="contractName">Contract Name:</label>
							<input
								v-model="formContractName"
								@input="$v.formContractName.$touch()"
								:class="($v.formContractName.$dirty && $v.formContractName.$invalid) ? 'is-invalid' : ''"
								type="text" class="form-control" id="contractName" placeholder="Contract Name">
							<div class="text-danger" v-if="$v.formContractName.$dirty && ! $v.formContractName.required">Contract Name is required</div>
						</div>
					</div>
					<div class="col-sm-4">
						<div class="form-group">
							<label for="compiler">Compiler:</label>
							<select id="compiler" class="form-control" v-model="formCompiler">
								<option v-for="option in compilers" v-bind:value="option">{{ option }}</option>
							</select>
						</div>
					</div>
					<div class="col-sm-2">
						<div class="form-group">
							<label for="optimization">Optimization:</label>
							<select id="optimization" class="form-control">
								<option value="1">Yes</option>
								<option value="0">No</option>
							</select>
						</div>
					</div>
				</div>

				<div class="form-group">
					<label for="solidityCode">Enter the Solidity Contract Code below</label>
					<textarea id="solidityCode" cols="30" rows="10" class="form-control"></textarea>
				</div>
			</div>
		</div>
	</section>
</template>
<script>
  import { validationMixin } from 'vuelidate'
  import { required, minLength } from 'vuelidate/lib/validators'

  export default {
    mixins: [validationMixin],
    data () {
      return {
        compilers: [],
        formContractAddress: '',
        formContractName: '',
        formCompiler: '',
      }
    },
    validations: {
      formContractAddress: {
        required,
      },
      formContractName: {
        required,
      },
      formCompiler: {
        required,
      },
    },
    mounted () {
      let self = this

      self.getVersions()
    },
    methods: {
      async getVersions () {
        let self = this
        let {data} = await self.$axios.get('/api/contracts/soljsons')

	      self.compilers = data
      },
    },
  }
</script>