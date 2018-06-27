<template>
    <p :class="'tomo-readmore' + (isReadMore ? ' tomo-readmore--is-open' : '')">
        <span
            class="mr-1"
            v-html="formattedString"/>
        <span
            v-show="text.length > maxChars"
            class="tomo-readmore__toggle">
            <a
                v-show="!isReadMore"
                :href="link"
                @click="toggleReadMore($event, true)">{{ moreStr }}</a>
            <a
                v-show="isReadMore"
                :href="link"
                @click="toggleReadMore($event, false)">{{ lessStr }}</a>
        </span>
    </p>
</template>

<script>
export default {
    props: {
        moreStr: {
            type: String,
            default: '+'
        },
        lessStr: {
            type: String,
            default: '-'
        },
        text: {
            type: String,
            required: true
        },
        link: {
            type: String,
            default: '#'
        },
        maxChars: {
            type: Number,
            default: 12
        }
    },

    data () {
        return {
            isReadMore: false
        }
    },

    computed: {
        formattedString () {
            var str = this.text

            if (!this.isReadMore && this.text.length > this.maxChars) {
                str = str.substring(0, this.maxChars) + '...'
            }

            return str
        }
    },

    methods: {
        toggleReadMore (e, b) {
            if (this.link === '#') {
                e.preventDefault()
            }
            if (this.lessStr !== null || this.lessStr !== '') {
                this.isReadMore = b
            }
        }
    }
}
</script>
