<script setup lang="ts">
// Rentals: self-drive bookings (table `fleet_bookings`, service rental). Permission: fleet.rentals.read (doc 27).
// TODO(pending: P9) see doc 30.
useHead({ title: 'Rentals' })
</script>

<template>
    <FleetServiceBookings title="Rentals" service="rental" subject="rentals" />
</template>
