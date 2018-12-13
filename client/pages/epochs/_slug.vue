<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card tomo-card--block">
            <div class="tomo-card__header">
                <h3
                    v-if="block"
                    class="tomo-card__headline">Epoc
                    <span class="d-none d-lg-inline-block headline__block-number">#{{ block.number / 900 }}</span>
                </h3>
                <div
                    v-if="block"
                    class="block-breadcrumb">
                    <div class="block-breadcrumb__prev">
                        <i class="tm tm-chevrons-left"/>
                        <nuxt-link :to="{name: 'blocks-slug', params: {slug: block.number - 1}}">Prev</nuxt-link>
                    </div>
                    <span class="block-breadcrumb__divider">|</span>
                    <div class="block-breadcrumb__next">
                        <nuxt-link :to="{name: 'blocks-slug', params: {slug: block.number + 1}}">Next</nuxt-link>
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
                            <td>Hash</td>
                            <td>
                                <read-more
                                    :text="block.hash"
                                    class="d-sm-none" />
                                <read-more
                                    :text="block.hash"
                                    :max-chars="20"
                                    class="d-none d-sm-block d-md-none"/>
                                <read-more
                                    :text="block.hash"
                                    :max-chars="40"
                                    class="d-none d-md-block d-lg-none"/>
                                <span class="d-none d-lg-block">{{ block.hash }}</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Parent Hash</td>
                            <td>
                                <nuxt-link :to="{name: 'blocks-slug', params: {slug: block.number - 1}}">
                                    <read-more
                                        :text="block.parentHash"
                                        class="d-sm-none" />
                                    <read-more
                                        :text="block.parentHash"
                                        :max-chars="20"
                                        class="d-none d-sm-block d-md-none"/>
                                    <read-more
                                        :text="block.parentHash"
                                        :max-chars="40"
                                        class="d-none d-md-block d-lg-none"/>
                                    <span class="d-none d-lg-block">{{ block.parentHash }}</span>
                                </nuxt-link>
                            </td>
                        </tr>
                        <tr>
                            <td>Gas Used</td>
                            <td>{{ formatNumber(block.gasUsed) }}</td>
                        </tr>
                        <tr>
                            <td>Gas Limit</td>
                            <td>{{ formatNumber(block.gasLimit) }}</td>
                        </tr>
                        <tr>
                            <td>Extra Data</td>
                            <td>
                                <read-more
                                    :text="block.extraData"
                                    class="d-sm-none"/>
                                <read-more
                                    :text="block.extraData"
                                    :max-chars="20"
                                    class="d-none d-sm-block d-md-none"/>
                                <read-more
                                    :text="block.extraData"
                                    :max-chars="40"
                                    class="d-none d-md-block"/>
                            </td>
                        </tr>
                        <tr>
                            <td>Masternodes</td>
                            <b-list-group>
                                <b-list-group-item
                                    v-for="(masternode, index) in epocDetail.m1m2"
                                    :key="index">
                                    <nuxt-link :to="{name: 'address-slug', params: {slug: masternode}}" >
                                        {{ masternode }}
                                    </nuxt-link>
                                </b-list-group-item>
                            </b-list-group>
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
                        slot="validator"
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
                validator: { label: 'Validator' },
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
