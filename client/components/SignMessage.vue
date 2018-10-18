<template>
    <div class="col-12">
        <div
            v-if="step === 1">
            <div>
                <strong>STEP 1 - Copy message below and sign the message using
                    <a
                        href="https://www.mycrypto.com/signmsg.html"
                        style="color: #3498db">MyCrypto</a>
                    or <a
                        href="https://www.myetherwallet.com/signmsg.html"
                        style="color: #3498db">MyEtherWallet</a>
                </strong>
            </div>
            <div
                style="margin-left: 15px">
                <div style="margin-top: 20px">
                    <input
                        type="radio"
                        checked>
                    <b>
                        Contract Owner/Creator: {{ address }}
                    </b>
                </div>
                <div
                    class="wrapper"
                    style="margin-top:10px">
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
                            <i class="fa fa-clipboard" />Copy</button>
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
                    </div>
                    <div
                        id="two">
                        <vue-qrcode
                            :value="message"
                            :options="{size: 250 }"
                            class="img-fluid text-center text-lg-right tomo-qrcode"/>
                    </div>
                </div>
                <div
                    style="margin-top: 20px">
                    <button
                        class="btn btn-primary"
                        @click.prevent="next">Next</button>
                </div>
            </div>
        </div>
        <div
            v-if="step === 2">
            <div>
                <div><strong>STEP 2 - Verify your signed Ethereum message</strong></div>
                <div
                    v-if="error">
                    <div style="float:left"><b>Result</b>:&nbsp;</div>
                    <div><span style="color:red;">Sorry! The
                    Message Signature Verification Failed.<br></span></div>
                </div>
            </div>
            <div style="margin-left: 15px; margin-top: 15px">
                <div>
                    <div>
                        <b>Contract Owner/Creator Address *</b>
                    </div>
                    <div>
                        <input
                            :value="address"
                            class="form-control"
                            type="text"
                            disabled
                            style="box-sizing: border-box; width: 50%">
                    </div>
                </div>
                <div
                    style="margin-top: 20px">
                    <section>
                        <div>
                            <label>
                                <b>Signed message</b>
                            </label>
                        </div>
                        <div>
                            <textarea
                                :value="message"
                                class="form-control"
                                disabled
                                cols="10"
                                rows="3"
                                style="box-sizing: border-box; width: 100%"/>
                        </div>
                    </section>
                </div>
                <div
                    style="margin-top: 20px">
                    <div>
                        <label>
                            <b>Message signature hash *</b>
                        </label>
                    </div>
                    <div>
                        <input
                            v-model="sigHash"
                            class="form-control"
                            type="text"
                            style="box-sizing: border-box; width: 100%"
                            placeholder="Enter the message signature hash">
                    </div>
                </div>
                <div
                    style="margin-top: 20px">
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
        error: false
    }),
    mounted () {
        let self = this

        self.message = '[Tomoscan ' + (new Date().toLocaleString().replace(/['"]+/g, '')) + ']' +
            ' I, hereby verify that the information provided is accurate and ' +
            'I am the owner/creator of the token contract address ' +
            '[' + self.address + ']'
    },
    methods: {
        next () {
            this.step++
        },
        async verifySignedMessage () {
            let self = this
            let params = {}
            if (self.message) {
                params.message = self.message
            }
            if (!self.sigHash) {
                self.error = true
            } else {
                params.signature = self.sigHash
                params.hash = self.address
                params.message = self.message
                const query = self.serializeQuery(params)
                let { data } = await self.$axios.get('/api/verifySignedMess' + '?' + query)

                if (data.error) {
                    self.error = true
                }
            }
            if (!self.error) {
                self.step = 0
                self.page.signHash = self.sigHash
                self.page.signMessage = self.message
                self.page.authen = true
            }
        },
        onSuccess () {
            this.$toast.show('Copied')
        }
    }
}
</script>
