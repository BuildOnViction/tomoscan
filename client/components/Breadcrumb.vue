<template>
    <div>
        <ol class="breadcrumb tomo-breadcrumb">
            <li
                v-for="(item, index) in items"
                :key="index"
                class="breadcrumb-item">
                <nuxt-link
                    v-if="isAddress"
                    :to="item.location"
                    active-class="active">
                    <read-more
                        :text="item.title"
                        class="d-xl-none" />
                    <span class="d-none d-xl-inline-block">{{ item.title }}</span>
                </nuxt-link>
                <nuxt-link
                    v-else
                    :to="item.location"
                    active-class="active">
                    {{ item.title }}
                </nuxt-link>
            </li>
        </ol>
    </div>
</template>
<script>
import mixin from '~/plugins/mixin'
import ReadMore from '~/components/ReadMore'
export default {
    components: {
        ReadMore
    },
    mixins: [mixin],
    data () {
        return {
            isAddress: this.$route.fullPath.startsWith('/address')
        }
    },
    computed: {
        items () {
            return this.$store.state.breadcrumb.items
        }
    }
}
</script>
