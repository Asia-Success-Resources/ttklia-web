<script setup lang="ts">
// Trips: daily trip sheet (replaces GGM sheet) (table `van_trips`, doc 19). Permission: fleet.van_trips.read (doc 27).
// The limo board's table design (components/VanBoard.vue) with fleet-management's van trip columns.
useHead({ title: 'Van trips' })
</script>

<template>
    <VanBoard title="Van trips" can-add />
</template>
