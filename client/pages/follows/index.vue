<template>
	<section>
		<div class="mb-4">
			<b-btn v-b-modal.modalAddFollow><i class="fa fa-plus-square mr-1"></i>Add New Address</b-btn>
			<b-modal
				ref="modalNewAddress"
				@keydown.native.enter="onAddNewFollowAddress"
				@hide="resetForm"
				id="modalAddFollow"
				title="Add a New Address to your Follow List">

				<div class="alert alert-danger" v-show="errorMessage">
					{{ errorMessage }}
				</div>

				<div class="form-group">
					<label class="control-label">Address:</label>
					<input
						v-model="formAddress"
						@input="$v.formAddress.$touch()"
						:class="($v.formAddress.$dirty && $v.formAddress.$invalid) ? 'is-invalid' : ''"
						type="text" class="form-control" name="address">
					<div class="text-danger" v-if="$v.formAddress.$dirty && ! $v.formAddress.required">Address is required</div>
					<div class="text-danger text-block" v-if="$v.formAddress.$dirty && ! $v.formAddress.isEthAddress">Address not eth address format</div>
				</div>
				<div class="form-group">
					<label class="control-label">Description (Optional):</label>
					<input type="text" class="form-control" v-model="formName">
				</div>
				<p>You can monitor and receive an alert when an address on your follow list receives an incoming TOMO Transaction.</p>
				<div class="form-group">
					<label class="control-label">Please select your notification method below:</label>
					<div class="form-check form-check-inline">
						<input
							v-model="formSendEmail"
							id="emailNotify" name="sendEmail" :value="true" type="radio" class="form-check-input">
						<label for="emailNotify" class="form-check-label">Email Notification</label>
					</div>

					<div class="form-check form-check-inline">
						<input id="noNotify" name="sendEmail" v-model="formSendEmail" :value="false" type="radio" class="form-check-input">
						<label for="noNotify" class="form-check-label">No Notification</label>
					</div>
				</div>
				<div class="form-group" v-if="formSendEmail">
					<div class="form-check form-check-inline">
						<input id="notifyReceive" type="checkbox" v-model="formNotifyReceive" value="1" class="form-check-input">
						<label for="notifyReceive">Notify on Incoming (Receive) Txns Only</label>
					</div>
					<div class="form-check form-check-inline">
						<input id="notifySent" type="checkbox" v-model="formNotifySent" value="1" class="form-check-input">
						<label for="notifySent">Notify on Outgoing (Sent) Txns Only</label>
					</div>
				</div>
				<div slot="modal-footer" class="w-100">
					<button type="submit" class="btn btn-primary float-right" @click="onAddNewFollowAddress">Submit</button>
					<button type="button" class="btn btn-secondary float-right mr-1" @click="$refs.modalNewAddress.hide()">Cancel</button>
					<button v-if="currentNotify" type="button" class="btn btn-danger float-left mr-1" @click="onUnfollow"><i class="fa fa-trash mr-1"></i>Delete</button>
				</div>
			</b-modal>
		</div>

		<p class="tomo-total-items">Total {{ formatNumber(total) }} items found</p>

		<div class="tm__table">
			<div class="tm__table_heading">
				<div class="row">
					<div class="col" v-for="field in fields">
						{{ field.label }}
					</div>
				</div>
			</div>
			<div class="tm__table_body">
				<div class="row tm__table_row" v-for="(item, index) in items">
					<div class="col tm__table_cell" v-for="(field, key) in fields">
						<div v-if="key === 'action'">
							<button class="btn btn-sm btn-link" @click="onEditNotify(item)"><i class="fa fa-pencil mr-1"></i>Edit</button>
						</div>

						<div v-if="key === 'address'">
							<nuxt-link :to="{name: 'address-slug', params: {slug: item.address}}">{{ item.address }}</nuxt-link>
						</div>

						<div v-if="key === 'balance'">
							<ul>
								<li>{{ formatUnit(toEther(item.addressObj.balance)) }}</li>
							</ul>
						</div>

						<div v-if="key === 'notification'">
							<span class="mr-1" v-if="item.sendEmail">Email Notification,</span>
							<span class="mr-1" v-else>Disabled</span>
							<span class="mr-1" v-if="item.notifyReceive">Notify Receive,</span>
							<span class="mr-1" v-if="item.notifySent">Notify Sent,</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<b-pagination
			align="center"
      class="tomo-pagination"
			:total-rows="total"
			:per-page="perPage"
			@change="onChangePaginate"
		></b-pagination>
	</section>
</template>

<script>
  import mixin from '~/plugins/mixin'
  import { validationMixin, withParams } from 'vuelidate'
  import { required, email } from 'vuelidate/lib/validators'

  export const isEthAddress = withParams({type: 'isEthAddress'}, value => /^(0x)?[0-9a-zA-Z]{40}$/.test(value))

  export default {
    mixins: [mixin, validationMixin],
    data () {
      return {
        fields: {
          action: {label: 'Action'},
          address: {label: 'Address'},
          balance: {label: 'Balance', sortable: false},
          notification: {label: 'Notification'},
        },
        loading: true,
        pagination: {},
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 15,
        pages: 1,
        errorMessage: null,
        formName: '',
        formAddress: '',
        formSendEmail: '',
        formNotifySent: null,
        formNotifyReceive: null,
        formIsEdit: false,
        currentNotify: null,
      }
    },
    validations: {
      formAddress: {
        required, isEthAddress,
      },
    },
    mounted () {
      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'follows', to: {name: 'follows'}})

      let self = this
      let query = self.$route.query
      if (query.page) {
        self.currentPage = parseInt(query.page)
      }
      if (query.limit) {
        self.perPage = parseInt(query.limit)
      }

      this.getDataFromApi()
    },
    methods: {
      async getDataFromApi () {
        let self = this

        // Show loading.
        self.loading = true

        let params = {
          page: self.currentPage,
          limit: self.perPage,
        }
        this.$router.replace({query: params})

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/follows' + '?' + query)
        self.items = data.items
        self.total = data.total
        self.currentPage = data.currentPage
        self.pages = data.pages

        // Hide loading.
        self.loading = false

        return data
      },

      onChangePaginate (page) {
        let self = this
        self.currentPage = page

        self.getDataFromApi()
      },

      async onAddNewFollowAddress (e) {
        let self = this
        e.preventDefault()

        if (this.$v.$invalid) {
          return
        }

        try {
          let body = {
            name: self.formName,
            address: self.formAddress,
            sendEmail: self.formSendEmail,
            notifySent: self.formSendEmail ? self.formNotifySent : false,
            notifyReceive: self.formSendEmail ? self.formNotifyReceive : false,
          }

          let url = '/api/follows'
          if (self.currentNotify) {
            url += '/' + self.currentNotify._id
          }

          let {data} = await self.$axios.post(url, body)

          if (data) {
            await self.getDataFromApi()
          }

          // Close modal.
          self.$refs.modalNewAddress.hide()
        }
        catch (e) {
          self.errorMessage = e.message
        }
      },

      async onEditNotify (item) {
        let self = this
        self.formAddress = item.address
        self.formName = item.name
        self.formSendEmail = item.sendEmail
        self.formIsEdit = true
        self.formNotifySent = item.notifySent
        self.formNotifyReceive = item.notifyReceive
        self.currentNotify = item
        // Show modal.
        self.$refs.modalNewAddress.show()
      },

      async onUnfollow () {
        let self = this
        if (!self.currentNotify) {
          return
        }
        let id = self.currentNotify._id
        let result = confirm('Are you sure want to delete this item?')
        if (result) {
          let {data} = await this.$axios.delete('/api/follows/' + id)

          if (data) {
            await self.getDataFromApi()
            self.resetForm()
          }
        }
      },

      resetForm () {
        this.formAddress = ''
        this.formName = ''
        this.formSendEmail = ''
        this.formIsEdit = false
        this.currentNotify = null
        this.formNotifyReceive = null
        this.formNotifySent = null
        this.errorMessage = ''
      },
    },
  }
</script>