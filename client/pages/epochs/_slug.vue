<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card tomo-card--block">
            <div class="tomo-card__header">
                <h3
                    v-if="epoch"
                    class="tomo-card__headline">Epoch
                    <span class="d-none d-lg-inline-block headline__block-block">#{{ epochNumber }}</span>
                </h3>
                <div
                    v-if="epoch"
                    class="block-breadcrumb">
                    <div class="block-breadcrumb__prev">
                        <i class="tm tm-chevrons-left"/>
                        <nuxt-link
                            :class="epochNumber === 1 ? 'disabled' : ''"
                            :to="epochNumber === 1 ? '#' : {name: 'epochs-slug', params: {slug: epochNumber - 1}}">
                            Prev</nuxt-link>
                    </div>
                    <span class="block-breadcrumb__divider">|</span>
                    <div class="block-breadcrumb__next">
                        <nuxt-link
                            :class="epochNumber === epoch.lastEpoch ? 'disabled' : ''"
                            :to="epoch.lastEpoch === epochNumber ? '#' :
                        {name: 'epochs-slug', params: {slug: epochNumber + 1}}">Next</nuxt-link>
                        <i class="tm tm-chevrons-right"/>
                    </div>
                </div>
            </div>
            <div class="tomo-card__body">
                <table
                    v-if="epoch"
                    class="tomo-card__table">
                    <tbody>
                        <tr>
                            <td>Epoch</td>
                            <td>{{ epochNumber }}</td>
                        </tr>
                        <tr>
                            <td>Start block</td>
                            <td>
                                <nuxt-link :to="{name: 'blocks-slug', params: {slug: epoch.startBlock}}">
                                    {{ epoch.startBlock + ' ( At ' +
                                    $moment(epoch.startTime).format('MMM Do YYYY, H:mm:ss') + ')' }}
                                </nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>End block</td>
                            <td>
                                <nuxt-link
                                    v-if="epoch.endTime !== null"
                                    :to="{name: 'blocks-slug', params: {slug: epoch.endBlock}}">
                                    {{ epoch.endBlock + ' ( At ' +
                                    $moment(epoch.endTime).format('MMM Do YYYY, H:mm:ss') + ')' }}
                                </nuxt-link>
                                <span v-else>
                                    {{ epoch.endBlock + ' (waiting...)' }}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td>Epoch duration</td>
                            <td>
                                <span v-if="epoch.endTime !== null">
                                    {{ formatNumber((new Date(epoch.endTime) - new Date(epoch.startTime)) / 1000) }}
                                    seconds
                                </span>
                                <span v-else>Waiting...</span>
                            </td>
                        </tr>
                        <tr>
                            <td>MasterNode number</td>
                            <td>
                                {{ epoch.masterNodeNumber }} MasterNode
                                <span v-if="epoch.slashedNode.length > 0">
                                    {{ epoch.slashedNode.length }} SlashedNode</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Voter number</td>
                            <td>{{ formatNumber(epoch.voterNumber) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <b-tabs
            ref="allTabs"
            v-model="tabIndex"
            class="tomo-tabs"
            @input="onSwitchTab">
            <!--:title="'Reward Voter (' + formatNumber(voterCount) + ')'"-->
            <b-tab
                title="Reward Voter"
                href="#voters">
                <table-reward-by-epoch
                    v-if="hashTab === '#voters'"
                    :epoch="epochNumber"
                    :reason="'voter'"
                    :parent="'voters'"
                    :page="this"/>
            </b-tab>
            <!--:title="'Reward Foundation (' + formatNumber(foundationCount) + ')'"-->
            <b-tab
                title="Reward Foundation"
                href="#foundations">
                <table-reward-by-epoch
                    v-if="hashTab === '#foundations'"
                    :epoch="epochNumber"
                    :reason="'foundation'"
                    :parent="'foundations'"
                    :page="this"/>
            </b-tab>
            <b-tab
                title="Slashed Node"
                href="#slashedNode">

                <div
                    v-if="epoch.slashedNode.length === 0"
                    class="tomo-empty">
                    <i class="fa fa-cube tomo-empty__icon"/>
                    <p class="tomo-empty__description">No slashed node</p>
                </div>

                <p
                    v-if="epoch.slashedNode.length > 0"
                    class="tomo-total-items">{{ _nFormatNumber('node', 'nodes', epoch.slashedNode.length) }}</p>
                <table
                    v-if="epoch.slashedNode.length > 0"
                    class="tomo-table">
                    <thead>
                        <tr><th>Coinbase</th></tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(item, index) in epoch.slashedNode"
                            :key="index">
                            <td>
                                <nuxt-link
                                    :to="{name: 'address-slug', params: {slug: item}}">{{ item }}</nuxt-link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </b-tab>
        </b-tabs>
    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import ReadMore from '~/components/ReadMore'
import TableRewardByEpoch from '~/components/TableRewardByEpoch'
export default {
    components: {
        ReadMore,
        TableRewardByEpoch
    },
    mixins: [mixin],
    head () {
        return {
            title: 'Epoch ' + this.$route.params.slug + ' Info'
        }
    },
    data () {
        return {
            epoch: null,
            epochNumber: 0,
            timestamp_moment: null,
            loading: true,
            voterCount: 0,
            foundationCount: 0,
            tabIndex: 0
        }
    },
    computed: {
        hashTab () {
            return this.$route.hash || '#voters'
        }
    },
    created () {
        this.epochNumber = parseInt(this.$route.params.slug)
    },
    async mounted () {
        try {
            let self = this

            self.loading = true

            // Init breadcrumbs data.
            this.$store.commit('breadcrumb/setItems', {
                name: 'epochs-slug',
                to: { name: 'epochs-slug', params: { slug: self.epochNumber } }
            })

            let responses = await Promise.all([
                this.$axios.get('/api/epochs/' + self.epochNumber)
            ])

            self.epoch = responses[0].data

            self.voterCount = self.epoch.rewardVoter
            self.foundationCount = self.epoch.rewardFoundation
            self.loading = false
        } catch (error) {
            console.log(error)
        }
    },
    methods: {
        onSwitchTab: function () {
            const allTabs = this.$refs.allTabs
            const location = window.location
            const value = this.tabIndex
            if (allTabs) {
                if (location.hash !== allTabs.tabs[value].href) {
                    this.$router.replace({
                        hash: allTabs.tabs[value].href
                    })
                } else {
                    location.hash = allTabs.tabs[value].href
                }
            }
        }
    }
}
</script>
