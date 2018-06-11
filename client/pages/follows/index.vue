<template>
  <div
    v-if="loading"
    :class="(loading ? 'tomo-loading tomo-loading--full' : '')"></div>
	  <section v-else>
      <div class="mb-4">
        <b-btn v-b-modal.modalAddFollow><i class="fa fa-plus-square mr-2"></i>Add New Address</b-btn>
        <b-modal
          class="tomo-modal tomo-modal--follow"
          ref="modalNewAddress"
          @keydown.native.enter="onAddNewFollowAddress"
          @hide="resetForm"
          id="modalAddFollow"
          title="Add a new address to your follow list">

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
            <div class="tomo-toggle">
              <input
                v-model="formSendEmail"
                id="emailNotify" name="sendEmail" :value="true" type="checkbox" class="tomo-toggle__checkbox">
              <label for="emailNotify" class="tomo-toggle__btn"></label>
              <span class="tomo-toggle__label"><i class="fa fa-envelope-o mr-2"></i>Email Notification</span>
            </div>
            <div class="tomo-toggle" v-if="formSendEmail">
              <input id="notifyReceive" type="checkbox" v-model="formNotifyReceive" value="1" class="tomo-toggle__checkbox">
              <label for="notifyReceive" class="tomo-toggle__btn"></label>
              <span class="tomo-toggle__label"><i class="tm-arrow-left text-danger mr-2"></i>Notify me on Incoming (Receive) Txns Only</span>
            </div>
            <div class="tomo-toggle" v-if="formSendEmail">
              <input id="notifySent" type="checkbox" v-model="formNotifySent" value="1" class="tomo-toggle__checkbox">
              <label for="notifySent" class="tomo-toggle__btn"></label>
              <span class="tomo-toggle__label"><i class="tm-arrow-right text-success mr-2"></i>Notify me on Outgoing (Sent) Txns Only</span>
            </div>
          </div>
          <div slot="modal-footer" class="w-100">
            <button type="submit" class="btn btn-primary float-right" @click="onAddNewFollowAddress">Submit</button>
            <button type="button" class="btn btn-secondary float-right mr-1" @click="$refs.modalNewAddress.hide()">Cancel</button>
            <button v-if="currentNotify" type="button" class="btn btn-danger float-left mr-1" @click="onUnfollow"><i class="fa fa-trash mr-1"></i>Delete</button>
          </div>
        </b-modal>
      </div>

    <div
      v-if="total == 0"
      class="tomo-empty">
        <i class="fa fa-chain-broken tomo-empty__icon"></i>
        <p class="tomo-empty__description">No address found</p>
    </div>

		<p
      v-if="total > 0"
      class="tomo-total-items">Total {{ formatNumber(total) }} items found</p>

    <table-base
      v-if="total > 0"
      :fields="fields"
      :items="items"
      class="tomo-table--follow">

      <template slot="address" slot-scope="props">
        <div>
          <i
            v-if="props.item.isContract"
            class="tm tm-icon-contract mr-1 mr-md-2" />
          <nuxt-link
            class="text-truncate"
            :to="{name: 'address-slug', params: {slug: props.item.address}}">{{ props.item.address }}</nuxt-link>
        </div>
      </template>

      <template slot="balance" slot-scope="props">
        <span class="d-lg-none" v-html="formatUnit(toEther(props.item.addressObj.balance, 5))"></span>
        <span class="d-none d-lg-block" v-html="formatUnit(toEther(props.item.addressObj.balance))"></span>
      </template>

      <template slot="notification" slot-scope="props">
        <ul class="list-unstyled">
          <li class="mr-1 mb-2" v-if="props.item.sendEmail"><i class="fa fa-envelope-o mr-2"></i>Email Notification</li>
          <li class="mr-1" v-else>Disabled</li>
          <li class="mr-1 mb-2" v-if="props.item.notifyReceive"><i class="tm-arrow-right text-success mr-2"></i>Notify Receive</li>
          <li class="mr-1 mb-2" v-if="props.item.notifySent"><i class="tm-arrow-left text-danger mr-2"></i>Notify Sent</li>
        </ul>
      </template>

      <template slot="action" slot-scope="props">
        <button class="btn btn-sm btn-link p-0 text-left" @click="onEditNotify(props.item)"><i class="fa fa-pencil mr-2"></i>Edit</button>
			</template>

    </table-base>

		<b-pagination
      v-if="total > 0"
      v-model="currentPage"
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
  import TableBase from '~/components/TableBase'

  export const isEthAddress = withParams({type: 'isEthAddress'}, value => /^(0x)?[0-9a-zA-Z]{40}$/.test(value))

  export default {
    components: {
      TableBase,
    },
    mixins: [mixin, validationMixin],
    data () {
      return {
        fields: {
          address: {label: 'Address'},
          balance: {label: 'Balance' },
          notification: {label: 'Notification'},
          action: {label: 'Action'},
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