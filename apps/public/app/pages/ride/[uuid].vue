<script setup lang="ts">
// A ride: the driver, a live map and the receipt once matched (Sitemap 1, doc 35). GET /rides/{uuid} (doc 04).
// TODO(api): wire once packages/api-client-ts is generated; live position on the ride's channel (doc 10).
useHead({ title: 'Your ride' })
const route = useRoute()
</script>

<template>
    <PublicSection title="Your ride" :lead="`Ride ${String(route.params.uuid)}`">
        <p class="text-sm text-muted">The driver, the live map and the receipt load from the API.</p>
    </PublicSection>
</template>
