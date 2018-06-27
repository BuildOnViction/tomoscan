<template>
    <section class="container text-center error-container">
        <h1 class="title text-danger">
            {{ error.statusCode }}
        </h1>
        <h2 class="info">
            {{ error.message }}
        </h2>
    </section>
</template>
<script>
export default {
    props: ['error'] // eslint-disable-line vue/require-prop-types
}
</script>
