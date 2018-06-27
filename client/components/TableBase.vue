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
        }
    }
}
</script>
