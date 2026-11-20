<script setup lang="ts">
// Limo: bookings by date and status (table `fleet_bookings`, doc 19). Permission: fleet.limo.read (doc 27).
// fleet-management's limousine board (components/LimoBoard.vue), with every booking; new ones are keyed here.
useHead({ title: 'Limo bookings' })
</script>

<template>
    <LimoBoard title="Limo bookings" can-add />
</template>
