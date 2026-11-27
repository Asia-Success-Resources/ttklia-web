<script setup lang="ts">
// auth.ttklia.com/{workspace} (lalaport, klia2, klia-taxi, fleet, ride, global): sign in to that workspace's app.
definePageMeta({ layout: 'blank' })
useHead({ title: 'Sign in' })

const route = useRoute()
const workspace = computed(() => String(route.params.workspace ?? ''))
</script>

<template>
    <AuthLogin :workspace="workspace" />
</template>
