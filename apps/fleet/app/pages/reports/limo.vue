<script setup lang="ts">
// Limo report (doc 19): GET /reports/limo?from&to, exported as CSV. Permission: fleet.reports_limo.read (doc 27).
useHead({ title: 'Limo report' })
</script>

<template>
    <FleetReport report="limo" title="Limo report" note="Limo jobs per day: completed, cancelled, cannot provide (lost revenue) and transferred, with revenue." />
</template>
