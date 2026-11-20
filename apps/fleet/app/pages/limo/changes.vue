<script setup lang="ts">
// Changes: client changes to accept (table `fleet_booking_changes`, doc 19). Permission: fleet.limo_changes.read (doc 27).
// fleet-management's limousine board (components/LimoBoard.vue), filtered.
// Shows the bookings with a change waiting (status pending), each marked with how many.
// TODO(api): accepting or rejecting a change has no endpoint in doc 04 yet (only POST /fleet/bookings/{uuid}/changes).
useHead({ title: 'Client changes' })
</script>

<template>
    <LimoBoard title="Client changes" with-pending-changes />
</template>
