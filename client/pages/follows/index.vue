<template>
	<section>
		<div class="mb-4">
			<b-btn v-b-modal.modalAddFollow><i class="fa fa-plus-square mr-1"></i>Add New Address</b-btn>
			<b-modal
				ref="modalNewAddress"
				@ok="onAddNewFollowAddress"
				@keydown.native.enter="onAddNewFollowAddress"
				id="modalAddFollow"
				title="Add a New Address to your Follow List">

				<div class="alert alert-danger" v-show="errorMessage">
					{{ errorMessage }}
				</div>

				<div class="form-group">
					<label class="control-label">Address:</label>
					<input
						v-model="form.address"
						v-validate="'required|test'"
						data-vv-as="Address"
						type="text" class="form-control" name="address">
					<span class="text-danger" v-show="errors.has('address')">{{ errors.first('address') }}</span>
				</div>
				<div class="form-group">
					<label class="control-label">Description (Optional):</label>
					<input type="text" class="form-control" v-model="form.name">
				</div>
				<p>You can monitor and receive an alert when an address on your follow list receives an incoming TOMO Transaction.</p>
				<div class="form-group">
					<label class="control-label">Please select your notification method below:</label>
					<div class="form-check form-check-inline">
						<input id="emailNotify" name="sendEmail" v-model="form.sendEmail" value="1" type="radio" class="form-check-input">
						<label for="emailNotify" class="form-check-label">Email Notification</label>
					</div>

					<div class="form-check form-check-inline">
						<input id="noNotify" name="sendEmail" v-model="form.sendEmail" value="0" type="radio" class="form-check-input">
						<label for="noNotify" class="form-check-label">No Notification</label>
					</div>
				</div>
			</b-modal>
		</div>

		<b-table
			striped
			responsive
			foot-clone
			small
			:fields="fields"
			:loading="loading"
			:items="items">

			<template slot="address" slot-scope="props">
				<nuxt-link class="address__tag" :to="{name: 'accounts-slug', params: {slug: props.item.address}}">{{ props.item.address }}</nuxt-link>
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
	</section>
</template>

<script>
  import mixin from '~/plugins/mixin'

  export default {
    mixins: [mixin],
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
        current_page: 1,
        per_page: 15,
        pages: 1,
        errorMessage: null,
        form: {
          address: '',
          name: '',
          sendEmail: '',
        },
      }
    },
    mounted () {
      // Init breadcrumbs data.
      this.$store.commit('breadcrumb/setItems', {name: 'follows', to: {name: 'follows'}})

      let self = this
      let query = self.$route.query
      if (query.page) {
        self.current_page = parseInt(query.page)
      }
      if (query.limit) {
        self.per_page = parseInt(query.limit)
      }

      this.getDataFromApi()
    },
    methods: {
      async getDataFromApi () {
        let self = this

        // Show loading.
        self.loading = true

        let params = {
          page: self.current_page,
          limit: self.per_page,
        }
        this.$router.replace({query: params})

        let query = this.serializeQuery(params)
        let {data} = await this.$axios.get('/api/follows' + '?' + query)
        self.items = data.items
        self.total = data.total
        self.current_page = data.current_page
        self.pages = data.pages

        // Hide loading.
        self.loading = false

        return data
      },

      async onAddNewFollowAddress (e) {
        let self = this
        e.preventDefault()

        let result = await self.$validator.validateAll()
        if (!result) {
          return
        }

        try {
          let body = self.form
          body.notifyReceive = true

          let {data} = await self.$axios.post('/api/follows', body)
          // Close modal.
          self.$refs.modalNewAddress.hide()

          self.resetModal()
        }
        catch (e) {
          self.errorMessage = e.message
        }
      },

      resetModal () {
        this.form.address = ''
        this.form.name = ''
        this.form.sendE = ''
        this.errorMessage = ''
      },
    },
  }
</script>