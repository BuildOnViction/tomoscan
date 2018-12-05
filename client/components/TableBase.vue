<template>
    <table class="tomo-table">
        <thead>
            <tr>
                <th
                    v-for="(field, key) in fields"
                    :key="key"
                    :class="field.cssClass">{{ field.label }}</th>
            </tr>
        </thead>
        <tbody>
            <tr
                v-for="(item, index) in items"
                v-if="pagin(index)"
                :key="index">
                <td
                    v-for="(field, key) in fields"
                    :key="key"
                    :data-label="field.label"
                    :class="field.cssClass">
                    <slot
                        :name="key"
                        :item="item"
                        :index="index">{{ item[key] }}</slot>
                </td>
            </tr>
        </tbody>
        <b-pagination
            v-if="pagination > 0 && items.length > pagination"
            v-model="currentPage"
            :total-rows="items.length"
            :per-page="pagination"
            size="md"
        />
    </table>
</template>
<script>
export default {
    props: {
        fields: {
            type: Object,
            default: () => {
                return {}
            }
        },
        items: {
            type: Array,
            default: () => {
                return []
            }
        },
        pagination: {
            type: Number,
            default: 0
        },
        current: {
            type: Number,
            default: 0
        }
    },
    data () {
        return {
            currentPage: this.current
        }
    },
    methods: {
        pagin: function (idx) {
            if (this.pagination === 0) return true
            if (this.current === 0) return false
            const upperBound = this.currentPage * this.pagination
            const lowerBound = (this.currentPage - 1) * this.pagination
            return idx >= lowerBound && idx < upperBound
        }
    }
}
</script>
