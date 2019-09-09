<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>

        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-cube tomo-empty__icon"/>
            <p class="tomo-empty__description">No reward found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('reward', 'rewards', total) }}</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--reward">
            <template
                slot="epoch"
                slot-scope="props">
                {{ props.item.epoch }}
            </template>
            <template
                slot="signNumber"
                slot-scope="props">
                {{ props.item.signNumber }}
            </template>
            <!--<template-->
            <!--slot="lockBalance"-->
            <!--slot-scope="props">-->
            <!--{{ formatNumber(props.item.lockBalance) }}-->
            <!--</template>-->
            <template
                slot="reward"
                slot-scope="props">
                {{ formatNumber(props.item.reward) }}
            </template>
            <template
                slot="validator"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.validator}}"
                    class="text-truncate">{{ props.item.validator }}</nuxt-link>
            </template>
            <template
                slot="validatorName"
                slot-scope="props">
                <nuxt-link
                    :to="{name: 'address-slug', params: {slug: props.item.validator}}"
                    class="text-truncate">{{ props.item.validatorName }}</nuxt-link>
            </template>
            <template
                slot="reason"
                slot-scope="props">
                {{ props.item.reason }}
            </template>

            <template
                slot="timestamp"
                slot-scope="props">
                <span
                    v-b-tooltip.hover
                    :title="$moment(props.item.rewardTime).format('lll')">
                    {{ $moment(props.item.rewardTime).fromNow() }}</span>
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

export default {
    components: {
        TableBase
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
        },
        parent: {
            type: String,
            default: ''
        }
    },
    data: () => ({
        fields: {
            epoch: { label: 'Epoch' },
            validator: { label: 'MasterNode' },
            validatorName: { label: 'MasterNode Name' },
            signNumber: { label: 'Sign number' },
            // lockBalance: { label: 'Lock balance' },
            reward: { label: 'Reward' },
            reason: { label: 'Reason' },
            timestamp: { label: 'Age' }
        },
        loading: true,
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 20,
        pages: 1
    }),
    async mounted () {
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

            let hash = this.$route.params.slug

            let query = this.serializeQuery(params)
            let { data } = await this.$axios.get('/api/rewards/' + hash + '?' + query)
            self.items = data.items
            self.total = data.total
            self.pages = data.pages
            self.page.rewardTime = data.total
            self.perPage = data.perPage

            // Hide loading.
            self.loading = false

            return data
        },
        onChangePaginate (page) {
            this.currentPage = page
            this.getDataFromApi()
        }
    }
}
</script>
