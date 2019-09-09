<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section
        v-else
        class="tomo-body-wrapper tomo-body-wrapper--follow">
        <div class="mb-4">
            <b-btn
                v-b-modal.modalAddFollow
                class="follow-button"><i class="fa fa-plus-square mr-2"/>Add New Address</b-btn>
            <b-modal
                id="modalAddFollow"
                ref="modalNewAddress"
                class="tomo-modal tomo-modal--follow"
                title="Add a new address to your follow list"
                @keydown.native.enter="onAddNewFollowAddress"
                @hide="resetForm">

                <div
                    v-show="errorMessage"
                    class="alert alert-danger">
                    {{ errorMessage }}
                </div>

                <div class="form-group">
                    <label class="control-label">Address:</label>
                    <input
                        v-model="formAddress"
                        :class="($v.formAddress.$dirty && $v.formAddress.$invalid) ? 'is-invalid' : ''"
                        type="text"
                        class="form-control"
                        name="address"
                        @input="$v.formAddress.$touch()">
                    <div
                        v-if="$v.formAddress.$dirty && ! $v.formAddress.required"
                        class="text-danger">Address is required</div>
                    <div
                        v-if="$v.formAddress.$dirty && ! $v.formAddress.isEthAddress"
                        class="text-danger text-block">Address not eth address format</div>
                </div>
                <div class="form-group">
                    <label class="control-label">Description (Optional):</label>
                    <input
                        v-model="formName"
                        type="text"
                        class="form-control">
                </div>
                <p>You can monitor and receive an alert when an address
                on your follow list receives an incoming TOMO Transaction.</p>
                <div class="form-group">
                    <div class="tomo-toggle">
                        <input
                            id="emailNotify"
                            v-model="formSendEmail"
                            :value="true"
                            name="sendEmail"
                            type="checkbox"
                            class="tomo-toggle__checkbox">
                        <label
                            for="emailNotify"
                            class="tomo-toggle__btn"/>
                        <span class="tomo-toggle__label"><i class="fa fa-envelope-o mr-2"/>Email Notification</span>
                    </div>
                    <div
                        v-if="formSendEmail"
                        class="tomo-toggle">
                        <input
                            id="notifyReceive"
                            v-model="formNotifyReceive"
                            type="checkbox"
                            value="1"
                            class="tomo-toggle__checkbox">
                        <label
                            for="notifyReceive"
                            class="tomo-toggle__btn"/>
                        <span class="tomo-toggle__label">
                            <i class="tm-arrow-left text-danger mr-2"/>
                            Notify me on Incoming (Receive) Txns Only
                        </span>
                    </div>
                    <div
                        v-if="formSendEmail"
                        class="tomo-toggle">
                        <input
                            id="notifySent"
                            v-model="formNotifySent"
                            type="checkbox"
                            value="1"
                            class="tomo-toggle__checkbox">
                        <label
                            for="notifySent"
                            class="tomo-toggle__btn"/>
                        <span class="tomo-toggle__label">
                            <i class="tm-arrow-right text-success mr-2"/>
                            Notify me on Outgoing (Sent) Txns Only
                        </span>
                    </div>
                </div>
                <div
                    slot="modal-footer"
                    class="w-100">
                    <button
                        type="submit"
                        class="btn btn-primary float-right"
                        @click="onAddNewFollowAddress">Submit</button>
                    <button
                        type="button"
                        class="btn btn-secondary float-right mr-1"
                        @click="$refs.modalNewAddress.hide()">Cancel</button>
                    <button
                        v-if="currentNotify"
                        type="button"
                        class="btn btn-danger float-left mr-1"
                        @click="onUnfollow"><i class="fa fa-trash mr-1"/>Delete</button>
                </div>
            </b-modal>
        </div>

        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-chain-broken tomo-empty__icon"/>
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

            <template
                slot="address"
                slot-scope="props">
                <div>
                    <i
                        v-if="props.item.isContract"
                        class="tm tm-icon-contract mr-1 mr-md-2" />
                    <nuxt-link
                        :to="{name: 'address-slug', params: {slug: props.item.address}}"
                        class="text-truncate">{{ props.item.address }}</nuxt-link>
                </div>
            </template>

            <template
                slot="balance"
                slot-scope="props">
                <span class="d-lg-none">{{ formatUnit(toTomo(props.item.addressObj.balance, 5)) }}</span>
                <span class="d-none d-lg-block">{{ formatUnit(toTomo(props.item.addressObj.balance)) }}</span>
            </template>

            <template
                slot="notification"
                slot-scope="props">
                <ul class="list-unstyled mb-0">
                    <li
                        v-if="props.item.sendEmail"
                        class="mr-1 mb-2"><i class="fa fa-envelope-o mr-2"/>Email Notification</li>
                    <li
                        v-else
                        class="mr-1">Disabled</li>
                    <li
                        v-if="props.item.notifyReceive"
                        class="mr-1 mb-2"><i class="tm-arrow-right text-success mr-2"/>Notify Receive</li>
                    <li
                        v-if="props.item.notifySent"
                        class="mr-1 mb-2"><i class="tm-arrow-left text-danger mr-2"/>Notify Sent</li>
                </ul>
            </template>

            <template
                slot="action"
                slot-scope="props">
                <button
                    class="btn btn-sm btn-link p-0 text-left"
                    @click="onEditNotify(props.item)"><i class="fa fa-pencil mr-2"/>Edit</button>
            </template>

        </table-base>

        <b-pagination
            v-if="total > 0 && total > perPage"
            v-model="currentPage"
            :total-rows="pages * perPage"
            :per-page="perPage"
            :number-of-pages="pages"
            :limit="7"
            align="center"
            class="tomo-pagination"
            @change="onChangePaginate"
        />
    </section>
</template>

<script>
import mixin from '~/plugins/mixin'
import { validationMixin, withParams } from 'vuelidate'
import { required } from 'vuelidate/lib/validators'
import TableBase from '~/components/TableBase'

export const isEthAddress = withParams({ type: 'isEthAddress' }, value => /^(0x)?[0-9a-zA-Z]{40}$/.test(value))

export default {
    components: {
        TableBase
    },
    mixins: [mixin, validationMixin],
    data () {
        return {
            fields: {
                address: { label: 'Address' },
                balance: { label: 'Balance' },
                notification: { label: 'Notification' },
                action: { label: 'Action' }
            },
            loading: true,
            total: 0,
            items: [],
            currentPage: 1,
            perPage: 20,
            pages: 1,
            errorMessage: null,
            formName: '',
            formAddress: '',
            formSendEmail: false,
            formNotifySent: null,
            formNotifyReceive: null,
            formIsEdit: false,
            currentNotify: null
        }
    },
    validations: {
        formAddress: {
            required, isEthAddress
        }
    },
    mounted () {
        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'follows', to: { name: 'follows' } })
        this.getDataFromApi()
    },
    methods: {
        async getDataFromApi () {
            let self = this

            // Show loading.
            self.loading = true

            let params = {
                page: self.currentPage,
                limit: self.perPage
            }

            let query = this.serializeQuery(params)
            let { data } = await this.$axios.get('/api/follows' + '?' + query)
            self.items = data.items
            self.total = data.total
            self.pages = data.pages

            // Hide loading.
            self.loading = false

            return data
        },

        onChangePaginate (page) {
            this.currentPage = page
            this.getDataFromApi()
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
                    notifyReceive: self.formSendEmail ? self.formNotifyReceive : false
                }
                let url = '/api/follows'
                if (self.currentNotify) {
                    url += '/' + self.currentNotify._id
                }

                let { data } = await self.$axios.post(url, body)

                if (data) {
                    await self.getDataFromApi()
                }

                // Close modal.
                self.$refs.modalNewAddress.hide()
            } catch (e) {
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
                let { data } = await this.$axios.delete('/api/follows/' + id)

                if (data) {
                    await self.getDataFromApi()
                    self.resetForm()
                }
            }
        },

        resetForm () {
            this.formAddress = ''
            this.formName = ''
            this.formSendEmail = false
            this.formIsEdit = false
            this.currentNotify = null
            this.formNotifyReceive = null
            this.formNotifySent = null
            this.errorMessage = ''
        }
    }
}
</script>
