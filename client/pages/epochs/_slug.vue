<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card tomo-card--block">
            <div class="tomo-card__header">
                <h3
                    v-if="block"
                    class="tomo-card__headline">Epoch
                    <span class="d-none d-lg-inline-block headline__block-number">#{{ block.number / 900 }}</span>
                </h3>
                <div
                    v-if="block"
                    class="block-breadcrumb">
                    <div class="block-breadcrumb__prev">
                        <i class="tm tm-chevrons-left"/>
                        <nuxt-link :to="{name: 'epochs-slug', params: {slug: block.number / 900 - 1}}">Prev</nuxt-link>
                    </div>
                    <span class="block-breadcrumb__divider">|</span>
                    <div class="block-breadcrumb__next">
                        <nuxt-link :to="{name: 'epochs-slug', params: {slug: block.number / 900 + 1}}">Next</nuxt-link>
                        <i class="tm tm-chevrons-right"/>
                    </div>
                </div>
            </div>
            <div class="tomo-card__body">
                <table
                    v-if="block"
                    class="tomo-card__table">
                    <tbody>
                        <tr v-if="timestamp_moment">
                            <td>TimeStamp</td>
                            <td v-html="timestamp_moment"/>
                        </tr>
                        <tr>
                            <td>Masternodes</td>
                            <td>
                                <b-list-group>
                                    <b-list-group-item
                                        v-for="(masternode, index) in epocDetail.m1m2"
                                        v-if="index < 5"
                                        :key="index">
                                        <nuxt-link :to="{name: 'address-slug', params: {slug: masternode}}" >
                                            {{ masternode }}
                                        </nuxt-link>
                                    </b-list-group-item>
                                </b-list-group>
                                <b-button
                                    v-b-modal.modal1
                                    v-if="epocDetail.m1m2.length > 5"
                                    :size="'sm'"
                                    :variant="'link'"
                                    class="pl-0"
                                >View all... (+{{ epocDetail.m1m2.length - 5 }} more)</b-button>
                                <b-modal
                                    id="modal1"
                                    :ok-only="true"
                                    :header-bg-variant="'primary'"
                                    :header-text-variant="'light'"
                                    title="Bootstrap-Vue">
                                    <template slot="modal-header">
                                        <h4>Masternodes</h4>
                                    </template>
                                    <div class="scrollable-container p-2 pl-4">
                                        <b-list-group-item
                                            v-for="(masternode, index) in epocDetail.m1m2"
                                            :key="index"
                                            class="mb-2">
                                            <nuxt-link :to="{name: 'address-slug', params: {slug: masternode}}">
                                                {{ masternode }}
                                            </nuxt-link>
                                        </b-list-group-item>
                                    </div>
                                </b-modal>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <b-tabs
            ref="allTabs"
            class="tomo-tabs">
            <b-tab
                v-for="(receiver, idx) in Object.keys(epocDetail.rewards)"
                :key="idx"
                :title="`${receiver} Reward (${epocDetail.rewards[receiver].length})`">
                <table-base
                    :pagination="8"
                    :current="1"
                    :fields="rewardTableFields"
                    :items="epocDetail.rewards[receiver]"
                    class="tomo-table--transactions__reward">
                    <template
                        slot="address"
                        slot-scope="data">
                        <nuxt-link
                            v-if="data.item.address"
                            :to="{name: 'address-slug', params: {slug: data.item.address}}"
                            class="text-truncate">
                            {{ data.item.address }}</nuxt-link>
                    </template>
                    <template
                        slot="masternode"
                        slot-scope="data">
                        <nuxt-link
                            v-if="data.item.validator"
                            :to="{name: 'address-slug', params: {slug: data.item.validator}}"
                            class="text-truncate">
                            {{ data.item.validator }}</nuxt-link>
                    </template>
                    <template
                        slot="reward"
                        slot-scope="data">
                        {{ data.item.reward }} TOMO
                    </template>
                    <template
                        slot="lockBalance"
                        slot-scope="data">
                        {{ formatNumber(data.item.lockBalance) }} TOMO
                    </template>
                </table-base>
            </b-tab>
        </b-tabs>
    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import TableTx from '~/components/TableTx'
import TableBase from '~/components/TableBase'
import ReadMore from '~/components/ReadMore'
import BlockSigner from '~/components/BlockSigner'

export default {
    components: {
        TableTx,
        TableBase,
        ReadMore,
        BlockSigner
    },
    mixins: [mixin],
    head () {
        return {
            title: 'Block ' + this.$route.params.slug + ' Info'
        }
    },
    data () {
        return {
            number: null,
            block: null,
            timestamp_moment: null,
            loading: true,
            txsCount: 0,
            blockSignerCount: 0,
            tabIndex: 0,
            epocDetail: null,
            rewardTableFields: {
                address: { label: 'Address' },
                masternode: { label: 'Masternode' },
                reward: { label: 'Reward' },
                lockBalance: { label: 'Lock Balance' }
            }
        }
    },
    computed: {
        hashTab () {
            return this.$route.hash || '#transactions'
        }
    },
    created () {
        let number = this.$route.params.slug
        if (number) {
            this.number = number.toString()
        }
    },
    async mounted () {
        let self = this

        self.loading = true

        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', {
            name: 'epochs-slug',
            to: { name: 'epochs-slug', params: { slug: self.number } }
        })

        let params = {}

        if (self.number) {
            params.block = self.number
        }
        params.list = 'blocks'

        let query = this.serializeQuery(params)

        let responses = await Promise.all([
            this.$axios.get('/api/epochs/' + this.$route.params.slug * 900),
            this.$axios.get('/api/counting' + '?' + query)
        ])

        this.block = responses[0].data
        let moment = self.$moment(responses[0].data.timestamp)
        this.timestamp_moment = `${moment.fromNow()} <small>(${moment.format('lll')} +UTC)</small>`

        self.txsCount = responses[1].data.txes

        self.blockSignerCount = responses[1].data.blockSigners
        self.epocDetail = responses[0].data.epocDetail
        self.loading = false
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
