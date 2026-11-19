<script setup lang="ts">
// Tickets with QR (Sitemap 1). GET /orders/{uuid} (doc 04).
// TODO(api): wire once packages/api-client-ts is generated.
const route = useRoute()
</script>

<template>
  <PublicSection title="Your tickets" :lead="`Order ${String(route.params.uuid)}`">
    <p class="text-sm text-muted">Tickets and QR codes load from the API.</p>
  </PublicSection>
</template>
