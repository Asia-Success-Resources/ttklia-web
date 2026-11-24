<script setup lang="ts">
// One ride request (doc 07): RideRequestDetail. Permission: ride.requests.read; cancelling needs ride.requests.write.
useHead({ title: 'Ride request' })
const route = useRoute()
</script>

<template>
    <RideRequestDetail :uuid="String(route.params.uuid)" title="Ride request" back="/requests" />
</template>
