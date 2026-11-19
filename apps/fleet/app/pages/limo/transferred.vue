<script setup lang="ts">
// Transferred: jobs given to third parties (table `fleet_bookings`, status `transferred`). Permission: fleet.limo_transferred.read (doc 27).
// fleet-management's limousine board (components/LimoBoard.vue), filtered.
// TODO(pending: P9) see doc 30: third parties for transfers, and what they cost.
</script>

<template>
  <LimoBoard title="Transferred" :statuses="['transferred']" />
</template>
