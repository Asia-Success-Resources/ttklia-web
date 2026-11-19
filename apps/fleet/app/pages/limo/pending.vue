<script setup lang="ts">
// Pending: waiting for Genting RSVN (table `fleet_bookings`, status `pending_reservation`). Permission: fleet.limo_pending.read (doc 27).
// fleet-management's limousine board (components/LimoBoard.vue), filtered.
</script>

<template>
  <LimoBoard title="Pending RSVN" :statuses="['pending_reservation']" />
</template>
