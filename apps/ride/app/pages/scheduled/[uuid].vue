<script setup lang="ts">
// Scheduled ride: detail, offers and Cancel with a reason (doc 35, Sitemap 4): RideRequestDetail.
// Permission: ride.scheduled.read; cancelling needs ride.scheduled.write.
useHead({ title: 'Scheduled ride' })
const route = useRoute()
</script>

<template>
    <RideRequestDetail :uuid="String(route.params.uuid)" title="Scheduled ride" back="/scheduled" />
</template>
