<script setup lang="ts">
// Booking status (Sitemap 1). GET /fleet/bookings/{uuid} (doc 04). TODO(api).
useHead({ title: 'Booking status' })
const route = useRoute()
</script>

<template>
    <PublicSection title="Booking status" :lead="String(route.params.uuid)"><p class="text-sm text-muted">Loading from the API.</p></PublicSection>
</template>
