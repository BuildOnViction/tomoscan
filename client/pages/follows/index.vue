<template>
	<section>
		<div class="mb-4">
			<b-btn v-b-modal.modalAddFollow><i class="fa fa-plus-square mr-1"></i>Add New Address</b-btn>
			<b-modal
				ref="modalNewAddress"
				@ok="onAddNewFollowAddress"
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
						<input id="emailNotify" name="sendEmail" v-model="formSendEmail" value="1" type="radio" class="form-check-input">
						<label for="emailNotify" class="form-check-label">Email Notification</label>
					</div>

					<div class="form-check form-check-inline">
						<input id="noNotify" name="sendEmail" v-model="formSendEmail" value="0" type="radio" class="form-check-input">
						<label for="noNotify" class="form-check-label">No Notification</label>
					</div>
				</div>
			</b-modal>
		</div>

		<p>Total {{ formatNumber(total) }} items found</p>

		<b-table
			striped
			responsive
			foot-clone
			small
			:fields="fields"
			:loading="loading"
			:items="items">

			<template slot="action" slot-scope="props">
				<button class="btn btn-sm btn-link" @click="onUnfollow(props.item._id)"><i class="fa fa-trash mr-1"></i>Remove</button>
				<button class="btn btn-sm btn-link" @click="onEditNotify(props.item)"><i class="fa fa-pencil mr-1"></i>Edit</button>
			</template>

			<template slot="address" slot-scope="props">
				<nuxt-link class="address__tag" :to="{name: 'address-slug', params: {slug: props.item.address}}">{{ props.item.address }}</nuxt-link>
			</template>

			<template slot="balance" slot-scope="props">
				<ul>
					<li>{{ formatUnit(toEther(props.item.addressObj.balance)) }}</li>
				</ul>
			</template>

			<template slot="notification" slot-scope="props">
				<span v-if="props.item.sendEmail">Email Notification,</span>
				<span v-if="props.item.notifyReceive">Notify Receive,</span>
				<span v-if="props.item.notifySent">Notify Sent,</span>
			</template>
		</b-table>

		<b-pagination
			align="center"
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

        if (this.$v.$error) {
          return
        }

        try {
          let body = {
            name: self.formName,
            address: self.formAddress,
            sendEmail: self.formSendEmail,
          }
          body.notifyReceive = true

          let url = '/api/follows'
          if (self.currentNotify) {
            url += '/' + self.currentNotify._id
          }
          console.log(url)

          let {data} = await self.$axios.post(url, body)
          // Close modal.
          self.$refs.modalNewAddress.hide()

          if (data) {
            self.getDataFromApi()
          }
        }
        catch (e) {
          self.errorMessage = e.message
        }
      },

      async onUnfollow (id) {
        let self = this
        let result = confirm('Are you sure want to delete this item?')
        if (result) {
          let {data} = await this.$axios.delete('/api/follows/' + id)

          if (data) {
            self.getDataFromApi()
          }
        }
      },

      async onEditNotify (item) {
        let self = this
        self.formAddress = item.address
        self.formName = item.name
        self.formSendEmail = item.sendEmail
        self.formIsEdit = true
        self.currentNotify = item
        // Show modal.
        self.$refs.modalNewAddress.show()
      },

      resetForm () {
        this.formAddress = ''
        this.formName = ''
        this.formSendEmail = ''
        this.formIsEdit = false
        this.currentNotify = null
        this.errorMessage = ''
      },
    },
  }
</script>