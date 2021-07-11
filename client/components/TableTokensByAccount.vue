<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div
            v-if="total == 0"
            class="tomo-empty">
            <i class="fa fa-exchange tomo-empty__icon"/>
            <p class="tomo-empty__description">No token found</p>
        </div>

        <p
            v-if="total > 0"
            class="tomo-total-items">{{ _nFormatNumber('token', 'tokens', total) }}</p>

        <table-base
            v-if="total > 0"
            :fields="fields"
            :items="items"
            class="tomo-table--tokens-by-account">

            <template
                slot="hash"
                slot-scope="props">
                <nuxt-link
                    v-if="tokenType === 'src20'"
                    :class="props.item.tokenObj ? '' : 'text-truncate'"
                    :to="{name: 'tokens-slug-src20-holder', params: {slug: props.item.token, holder: holder}}">
                    {{ props.item.tokenObj ? props.item.tokenObj.name : props.item.token }}</nuxt-link>
                <nuxt-link
                    v-if="tokenType === 'src21'"
                    :class="props.item.tokenObj ? '' : 'text-truncate'"
                    :to="{name: 'tokens-slug-src21-holder', params: {slug: props.item.token, holder: holder}}">
                    {{ props.item.tokenObj ? props.item.tokenObj.name : props.item.token }}</nuxt-link>
                <nuxt-link
                    v-if="tokenType === 'src721'"
                    :class="props.item.tokenObj ? '' : 'text-truncate'"
                    :to="{name: 'tokens-slug-src721-holder', params: {slug: props.item.token, holder: holder}}">
                    {{ props.item.tokenObj ? props.item.tokenObj.name : props.item.token }}</nuxt-link>
            </template>

            <template
                slot="quantity"
                slot-scope="props">
                <span
                    v-if="tokenType === 'src20' || tokenType === 'src21'">
                    {{ formatUnit(toTokenQuantity(props.item.quantity, props.item.tokenObj.decimals),
                                  props.item.tokenObj.symbol) }}</span>
                <span
                    v-if="tokenType === 'src721'">
                    {{ props.item.tokenId }}</span>
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
            @change="onChangePaginate"/>
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
        holder: {
            type: String,
            default: ''
        },
        tokenType: {
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
            hash: { label: 'Token' },
            quantity: { label: 'Quantity' }
        },
        loading: true,
        total: 0,
        items: [],
        currentPage: 1,
        perPage: 15,
        pages: 1,
        block: null
    }),
    async created () {
        if (this.tokenType === 'src721') {
            this.fields.quantity.label = 'Token Id'
        }
        await this.getDataFromApi()
    },
    methods: {
        async getDataFromApi () {
            // Show loading.
            this.loading = true

            const params = {
                page: this.currentPage,
                limit: this.perPage
            }

            const query = this.serializeQuery(params)
            const url = `/api/tokens/holding/${this.tokenType}/${this.holder}` + '?' + query
            const { data } = await this.$axios.get(url)
            this.items = data.items
            this.total = data.total
            this.pages = data.pages

            if (this.page) {
                this.page.tokensCount = this.total
            }

            // Hide loading.
            this.loading = false
            return data
        },
        async onChangePaginate (page) {
            this.currentPage = page
            await this.getDataFromApi()
        }
    }
}
</script>
