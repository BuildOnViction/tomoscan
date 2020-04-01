<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card tomo-card--verify">
            <div class="tomo-card__header">
                <h3 class="tomo-card__headline">Download Data</h3>
                <p>The information you requested can be downloaded from this page.
                But before continuing <strong>please verify that you are not a robot by</strong>
                    completing the captcha below.</p>
            </div>
            <div class="tomo-card__body">

                <ul
                    v-if="errors.length"
                    class="alert alert-danger">
                    <li
                        v-for="(error, index) in errors"
                        :key="index">{{ error }}
                    </li>
                </ul>

                <form
                    :class="loadingForm ? 'tomo-loading tomo-loading--form' : ''"
                    novalidate
                    @submit.prevent="onSubmit">
                    <div class="row">
                        <div class="col-sm-6 col-lg-3">
                            <div class="form-group">
                                <label for="contractAddress">Contract Address *</label>
                                <input
                                    id="contractAddress"
                                    v-model="contractAddress"
                                    type="text"
                                    class="form-control"
                                    placeholder="Contract Address">
                                <div
                                    class="text-danger">Contract Address is required
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6 col-lg-3">
                            <div class="form-group">
                                <label>Date range *</label>
                                <date-picker
                                    v-model="dateRange"
                                    :show-time-panel="showTimeRangePanel"
                                    type="datetime"
                                    placeholder="Select datetime range"
                                    range
                                    @close="handleRangeClose"
                                >
                                    <template v-slot:footer>
                                        <button
                                            class="mx-btn mx-btn-text"
                                            @click="toggleTimeRangePanel">
                                            {{ showTimeRangePanel ? 'select date' : 'select time' }}
                                        </button>
                                    </template>
                                </date-picker>
                                <div
                                    class="text-danger">Contract Name is required
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <button
                            :disabled="loadingForm"
                            type="submit"
                            class="btn btn-primary mr-1">
                            <i
                                v-if="loadingForm"
                                class="fa fa-cog fa-spin mr-2"/>Download
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </section>
</template>
<script>
import { validationMixin } from 'vuelidate'
import DatePicker from 'vue2-datepicker'
import 'vue2-datepicker/index.css'

export default {
    components: { DatePicker },
    mixins: [validationMixin],
    data () {
        return {
            contractAddress: '',
            dateRange: '',
            errors: [],
            loadingForm: false,
            loading: true,
            showTimeRangePanel: false
        }
    },
    async mounted () {
        await this.$recaptcha.init()
        let self = this

        self.loading = true

        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'download', to: { name: 'download' } })

        let address = self.$route.query.address
        if (address) {
            self.contractAddress = address
        }

        self.loading = false
    },
    methods: {
        toggleTimeRangePanel () {
            this.showTimeRangePanel = !this.showTimeRangePanel
        },
        handleRangeClose () {
            this.showTimeRangePanel = false
        },
        async onSubmit () {
            let token = await this.$recaptcha.execute('login')
            console.log('ReCaptcha token:', token)
        }
    }
}
</script>
