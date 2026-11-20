<script setup lang="ts">
// Book a rental or van seat (Sitemap 1). POST /fleet/bookings (doc 04).
// TODO(pending: P9) are public van seats and rentals still running? (doc 30)
// TODO(api): wire once packages/api-client-ts is generated.
useHead({ title: 'Rentals' })
</script>

<template>
    <PublicSection title="Rentals and van seats"><p class="text-sm text-muted">Booking opens here.</p></PublicSection>
</template>
