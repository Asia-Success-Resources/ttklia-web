<script setup lang="ts">
// Choose seats (Sitemap 1). Seat map from GET /bus/trips/{uuid}/seats; hold with POST /bus/trips/{id}/holds (doc 04).
// TODO(api): wire once packages/api-client-ts is generated.
const route = useRoute()
const tripId = computed(() => String(route.params.id))
</script>

<template>
  <PublicSection title="Choose seats" :lead="`Trip ${tripId}`">
    <p class="text-sm text-muted">The seat map loads from the API.</p>
    <UButton class="mt-6" to="/checkout" label="Continue" />
  </PublicSection>
</template>
