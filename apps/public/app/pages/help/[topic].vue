<script setup lang="ts">
// Help centre topic (doc 09: /help/:topic on teeko.ai). TODO(api): help content source is not in the docs yet.
useHead({ title: 'Help' })
</script>

<template>
    <PublicSection title="Help" :lead="String(useRoute().params.topic)">
        <p class="text-sm text-muted">The help article loads here.</p>
        <UButton class="mt-4" to="/help" label="All help topics" variant="outline" />
    </PublicSection>
</template>
