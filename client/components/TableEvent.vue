<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>

        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-binoculars tomo-empty__icon"/>
            <p class="tomo-empty__description">No event found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('item', 'items', total) }}</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--events">

            <template
                slot="label"
                slot-scope="props">
                <read-more
                    :text="props.item.transactionHash"
                    :max-chars="20"
                    class="d-sm-none" />
                <read-more
                    :text="props.item.transactionHash"
                    :max-chars="40"
                    class="d-none d-sm-block d-md-none d-2xl-block"/>
                <span class="d-none d-md-block d-lg-none">{{ props.item.transactionHash }}</span>
                <read-more
                    :text="props.item.transactionHash"
                    :max-chars="30"
                    class="d-none d-lg-block d-2xl-none" />
                <span class="d-block">
                    <nuxt-link :to="{name: 'blocks-slug', params: {slug: props.item.blockNumber}}">
                        #{{ props.item.blockNumber }}</nuxt-link>
                </span>
                <div v-if="props.item.block">{{ $moment(props.item.block.timestamp).fromNow() }}</div>
            </template>

            <template
                slot="method"
                slot-scope="props">
                <div class="d-block">{{ props.item.methodName }}</div>
                <div class="d-block">[{{ props.item.methodCode }}]</div>
            </template>

            <template
                slot="logs"
                slot-scope="props">
                <div
                    v-if="isTransferEvent(props.item.topics[0])"
                    class="transfer-event">
                    <b-link
                        v-b-toggle="'collapse' + props.index"
                        class="transfer-event__name">Transfer</b-link>
                    <span class="text-black"> (index_topic_1</span>
                    <span class="text-purple"> address</span>
                    <span class="text-danger"> from</span>
                    <span class="text-black">, index_topic_2</span>
                    <span class="text-purple"> address</span>
                    <span class="text-danger"> to</span>
                    <span class="text-black">, </span>
                    <span class="text-purple">uint256</span>
                    <span class="text-danger"> value</span>
                    <span class="text-black">) </span>
                </div>
                <b-collapse
                    :id="'collapse' + props.index"
                    class="mt-2 mb-2">
                    <div v-if="isTransferEvent(props.item.topics[0])">
                        <ul
                            v-if="props.item.transfer"
                            class="list-unstyled event-logs">
                            <li class="event-logs__item">
                                <span class="d-block"><i class="text-muted">address</i> from</span>
                                <nuxt-link
                                    :to="{
                                        name: 'address-slug',
                                        params: {slug: unformatAddress(props.item.transfer.from)}}">
                                    {{ unformatAddress(props.item.transfer.from) }}
                                </nuxt-link>
                            </li>
                            <li class="event-logs__item">
                                <span class="d-block"><i class="text-muted">address</i> to</span>
                                <nuxt-link
                                    :to="{
                                    name: 'address-slug', params: {slug: unformatAddress(props.item.transfer.to)}}">
                                    {{ unformatAddress(props.item.transfer.to) }}
                                </nuxt-link>
                            </li>
                            <li class="event-logs__item">
                                <span class="d-block"><i class="text-muted">unit256</i> value</span>
                                <span class="d-block">{{ convertHexToInt(props.item.transfer.value) }}</span>
                            </li>
                        </ul>
                    </div>
                </b-collapse>
                <ul class="list-unstyled event-logs">
                    <li
                        v-for="(topic, i) in props.item.topics"
                        :key="i"
                        class="event-logs__item">
                        <span :class="'event-logs__topic ' + (i === 0 ? 'text-muted': '')">
                            [topic {{ i }}]
                            <read-more
                                :text="topic"
                                class="d-sm-none" />
                            <read-more
                                :text="topic"
                                :max-chars="40"
                                class="d-none d-sm-inline-block d-md-none d-2xl-inline-block" />
                            <span class="d-none d-md-inline-block d-lg-none">{{ topic }}</span>
                            <read-more
                                :text="topic"
                                :max-chars="30"
                                class="d-none d-md-none d-lg-inline-block d-2xl-none" />
                        </span>
                    </li>
                </ul>
                <ul class="list-unstyled event-logs">
                    <li
                        v-for="(data, index) in props.item.datas"
                        :key="index"
                        class="event-logs__item">
                        <i class="tm-arrow-right text-success mr-2"/>
                        <read-more
                            :text="data"
                            :max-chars="18"
                            class="event-logs__data d-sm-none" />
                        <read-more
                            :text="data"
                            :max-chars="40"
                            class="event-logs__data d-none d-sm-inline-block d-md-none d-2xl-inline-block" />
                        <span class="event-logs__data d-none d-md-inline-block d-lg-none">{{ data }}</span>
                        <read-more
                            :text="data"
                            :max-chars="30"
                            class="event-logs__data d-none d-lg-inline-block d-2xl-none" />
                    </li>
                </ul>
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
import TableBase from '~/components/TableBase'
import ReadMore from '~/components/ReadMore'

export default {
    components: {
        TableBase,
        ReadMore
    },
    mixins: [mixin],
    props: {
        address: {
            type: String,
            default: ''
        },
        tx: {
            type: String,
            default: ''
        },
        page: {
            type: Object,
            default: () => {
                return {}
            }
        },
        parent: {
            type: String,
            default: ''
        }
    },
    data: () => ({
        fields: {
            label: { label: 'TxHash|Block|Age' },
            method: { label: 'Method' },
            logs: { label: 'Event Logs' }
        },
        loading: true,
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 15,
        pages: 1
    }),
    async mounted () {
        let self = this
        // Init from router.
        let query = self.$route.query

        if (query.block) {
            self.block = query.block
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
                limit: self.perPage
            }
            if (self.block) {
                params.block = self.block
            }
            if (self.type) {
                params.type = self.type
            }

            if (self.address) {
                params.address = self.address
            }
            if (self.tx) {
                params.tx = self.tx
            }

            let query = this.serializeQuery(params)
            let { data } = await self.$axios.get('/api/logs?' + query)
            self.items = data.items
            self.total = data.total
            self.pages = data.pages
            if (self.items.length) {
                for (let i = 0; i < self.items.length; i++) {
                    self.items[i] = self.formatItem(self.items[i])
                }
            }

            // Hide loading.
            self.loading = false
            self.page.eventsCount = self.total

            return data
        },
        onChangePaginate (page) {
            this.currentPage = page
            this.getDataFromApi()
        },
        formatItem (item) {
        // Parse input data to array.
            let data = item.data
            data = data.replace('0x', '')
            item.datas = data.match(/.{1,64}/g)
            if (item.datas) {
                item.hexDatas = item.datas.map((item) => item.replace(/^0+/, '')).map((item) => '0x' + item)
            }
            item.transfer = {}
            if (item.topics.length < 3) {
                item.transfer.from = item.hexDatas[0]
                item.transfer.to = item.hexDatas[1]
                item.transfer.value = item.hexDatas[2]
            } else {
                item.transfer.from = item.topics[1]
                item.transfer.to = item.topics[2]
                item.transfer.value = item.data
            }

            return item
        },
        isTransferEvent: (code) => code === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    }
}
</script>
