<script setup lang="ts">
// Drivers report (doc 19): GET /reports/drivers?from&to, exported as CSV. Permission: fleet.reports_drivers.read (doc 27).
useHead({ title: 'Drivers report' })
</script>

<template>
    <FleetReport report="drivers" title="Drivers report" note="Jobs per driver in these days: limo and van, completed, taken off, and per-trip pay." />
</template>
