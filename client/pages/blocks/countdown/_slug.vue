<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card tomo-card--block">
            <div class="row align-items-center">
                <div class="col-lg-5 mb-5 mb-lg-0">
                    <img
                        src="~/assets/img/countdown.png"
                        style="width: 100%">
                </div>
                <div class="col-lg-1"></div>
                <div class="col-lg-6 mb-5 mb-lg-0">
                    <vue-countdown
                        :time="remainingBlock * blockDuration * 1000"
                        class="countdown-time">
                        <template slot-scope="time">
                            <span class="font-weight-bold h2">
                                {{ time.days > 0 ? time.days : '' }}</span> days
                            <span class="font-weight-bold h2">
                                {{ String(time.hours).length > 1 ? time.hours : '0' + time.hours }}</span> hours
                            <span class="font-weight-bold h2">
                                {{ String(time.minutes).length > 1 ? time.minutes : '0' + time.minutes }}</span> minutes
                            <span class="font-weight-bold h2">
                                {{ String(time.seconds).length > 1 ? time.seconds : '0' + time.seconds }}</span> seconds
                        </template>
                    </vue-countdown>
                    <p class="estimated-time">
                        Estimated Target Date: <span class="font-weight-bold h6">{{ new Date(targetTime) }}</span></p>
                    <div class="row box-items">
                        <div class="col-md-4 mb-3 mb-md-0">
                            <div class="card text-white bg-blue countdown-box h-100">
                                <div class="card-body">
                                    <p class="card-title">Countdown For Block</p>
                                    <p class="card-text">#{{ number }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 mb-3 mb-md-0">
                            <div class="card countdown-box h-100">
                                <div class="card-body">
                                    <p class="card-title">Current Block</p>
                                    <p class="card-text">#{{ currentBlock }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card countdown-box h-100">
                                <div class="card-body">
                                    <p class="card-title">Remaining Blocks</p>
                                    <p class="card-text">#{{ remainingBlock }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import VueCountdown from '@chenfengyuan/vue-countdown'

export default {
    components: {
        VueCountdown
    },
    mixins: [mixin],
    data () {
        return {
            number: null,
            loading: true,
            currentBlock: 0,
            remainingBlock: 0,
            blockDuration: 2,
            targetTime: new Date()
        }
    },
    computed: {
    },
    created () {
        const number = this.$route.params.slug
        if (number) {
            this.number = number.toString()
        }
    },
    async mounted () {
        try {
            this.loading = true

            // Init breadcrumbs data.
            this.$store.commit('breadcrumb/setItems', {
                name: 'blocks-countdown-slug',
                to: { name: 'blocks-countdown-slug', params: { slug: this.number } }
            })

            const responses = await this.$axios.get('/api/blocks/countdown/' + this.$route.params.slug)

            this.currentBlock = responses.data.currentBlock
            this.remainingBlock = responses.data.remainingBlock
            if (this.remainingBlock <= 0) {
                return this.$router.push({ name: 'blocks-slug', params: { slug: this.number } })
            }
            this.blockDuration = responses.data.blockDuration
            this.targetTime = this.targetTime.setSeconds(this.targetTime.getSeconds() + this.remainingBlock * 2)

            this.loading = false
        } catch (error) {
            console.log(error)
        }
    },
    methods: {
    },
    head () {
        return {
            title: 'TomoChain Block Countdown'
        }
    }
}
</script>
