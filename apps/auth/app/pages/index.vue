<script setup lang="ts">
// auth.ttklia.com: sign in, then pick a workspace (or go straight on when the user has only one).
definePageMeta({ layout: 'blank' })
useHead({ title: 'Sign in' })
</script>

<template>
    <AuthLogin />
</template>
