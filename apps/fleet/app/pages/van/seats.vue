<script setup lang="ts">
// Seats: public seat bookings on per-seat van routes (table `fleet_bookings`, service van_seat). Permission:
// fleet.van_seats.read (doc 27). TODO(pending: P9) see doc 30.
useHead({ title: 'Van seats' })
</script>

<template>
    <FleetServiceBookings title="Van seats" service="van_seat" subject="seat bookings" />
</template>
