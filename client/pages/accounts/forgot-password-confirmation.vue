<template>
    <b-row>
        <b-col md="3"/>
        <b-col md="8">
            <div class="panel-content">
                <h2>Check Your Email</h2>
                <p>
                    We just sent instructions for completing your password
                    reset to your email address {{ email }}</p>
                <p>
                    If you don't see it in your inbox within the next few minutes,
                    try looking in your spam folder.</p>
            </div>
        </b-col>
        <b-col />
    </b-row>
</template>

<script>
export default {
    data () {
        return {
            email: ''
        }
    },
    created () {
        const self = this
        self.email = self.hideEmail(self.$route.params.email || '')
    },
    methods: {
        hideEmail (email) {
            let hiddenEmail = ''
            for (let i = 0; i < email.length; i++) {
                if (i > 3 && i < email.indexOf('@')) {
                    hiddenEmail += '*'
                } else {
                    hiddenEmail += email[i]
                }
            }
            return hiddenEmail
        }
    }
}
</script>
