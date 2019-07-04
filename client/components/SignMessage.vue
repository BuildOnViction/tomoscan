<template>
    <div class="col-12">
        <div
            v-if="step === 1">
            <div>
                <strong>Method 1: Copy message below and sign the message using
                    <a
                        href="https://www.mycrypto.com/signmsg.html"
                        style="color: #3498db">MyCrypto</a>
                    or <a
                        href="https://www.myetherwallet.com/signmsg.html"
                        style="color: #3498db">MyEtherWallet</a>
                </strong>
            </div>
            <div
                style="margin-top: 10px">
                <strong>
                    Method 2(easier): Using QR code scanning feature in TomoWallet to sign
                </strong>
            </div>
            <div
                v-if="error">
                <div style="float:left"><b>Result</b>:&nbsp;</div>
                <div><span style="color:red;">Sorry! The
                Message Signature Verification Failed.<br></span></div>
            </div>
            <div
                style="margin-left: 15px">
                <div style="margin-top: 15px">
                    <input
                        type="radio"
                        checked>
                    <b>
                        Contract Owner/address: {{ creator }}
                    </b>
                </div>
                <div
                    class="wrapper">
                    <div
                        id="one">
                        <label>
                            <b>Sign message</b>
                        </label>
                        <div
                            class="pull-right"
                            style="margin-right: -7px">
                            <button
                                v-clipboard="message"
                                type="button"
                                class="btn btn-sm mr-2 code-actions__copy"
                                @success="onSuccess">
                            <i class="fa fa-clipboard" /> Copy</button>
                        </div>
                        <label style="margin-top: 5px">
                            <textarea
                                :value="message"
                                disabled
                                cols="300"
                                rows="3"
                                class="form-control"
                                style="width: 100%"/>
                        </label>
                        <div
                            style="margin-top: 10px">
                            <input
                                v-model="sigHash"
                                class="form-control"
                                type="text"
                                style="box-sizing: border-box; width: 100%"
                                placeholder="Enter the message signature hash">
                        </div>
                    </div>
                    <div
                        id="two">
                        <vue-qrcode
                            :value="qrCode"
                            :options="{size: 200 }"
                            tag="img"/>
                    </div>
                </div>
                <div
                    style="margin-top: 20px">
                    <!-- <button
                        class="btn btn-primary"
                        @click.prevent="next">Next</button> -->
                    <button
                        class="btn btn-primary"
                        @click.prevent="verifySignedMessage">Verify</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import mixin from '~/plugins/mixin'
import VueQrcode from '@xkeshi/vue-qrcode'
export default {
    components: {
        VueQrcode
    },
    mixins: [mixin],
    props: {
        address: {
            type: String,
            default: ''
        },
        page: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    data: () => ({
        message: '',
        sigHash: '',
        step: 1,
        error: false,
        qrCode: '',
        messId: '',
        processingMess: true,
        interval: null,
        creator: ''
    }),
    destroyed () {
        if (this.interval) {
            clearInterval(this.interval)
        }
    },
    async mounted () {
        let self = this
        let acc = await this.$axios.get('/api/contractCreator/' + self.address)
        self.creator = acc.data.contractCreation || self.address
        let { data } = await self.$axios.post('/api/generateSignMess', { address: self.address })

        self.message = data.message
        self.messId = data.id

        self.qrCode = encodeURI('tomochain:sign?message=' + data.message + '&' +
            'submitURL=' + data.url + data.id)

        if (self.processingMess) {
            self.interval = setInterval(async () => {
                await this.verifyScannedQR()
            }, 2000)
        }
    },
    methods: {
        next () {
            if (this.interval) {
                clearInterval(this.interval)
            }
            this.step++
        },
        async verifyScannedQR () {
            let self = this
            let body = {}
            if (self.message) {
                body.message = self.message
            }
            body.signature = self.sigHash
            body.hash = self.address
            body.messId = self.messId
            let { data } = await self.$axios.post('/api/verifyScanedMess', body)

            if (!data.error) {
                if (self.interval) {
                    clearInterval(self.interval)
                }
                self.processingMess = false
                self.step = 0
                self.page.signHash = data.signHash
                self.page.signMessage = data.message
                self.page.authen = true
            }
        },
        async verifySignedMessage () {
            let self = this
            let body = {}
            if (self.message) {
                body.message = self.message
            }
            if (!self.sigHash) {
                self.error = true
            } else {
                body.signature = self.sigHash
                body.hash = self.address
                let { data } = await self.$axios.post('/api/verifySignedMess', body)

                if (data.error) {
                    self.error = true
                }
                if (data === 'OK') {
                    if (self.interval) {
                        clearInterval(self.interval)
                    }
                    self.processingMess = false
                    self.step = 0
                    self.page.signHash = self.sigHash
                    self.page.signMessage = self.message
                    self.page.authen = true
                }
            }
        },
        onSuccess () {
            this.$toast.show('Copied')
        }
    }
}
</script>
