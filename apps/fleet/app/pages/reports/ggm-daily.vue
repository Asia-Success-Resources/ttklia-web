<script setup lang="ts">
// GGM daily (doc 19): GET /reports/ggm-daily?from&to, exported as CSV. Permission: fleet.reports_ggm_daily.read (doc 27).
useHead({ title: 'GGM daily' })
</script>

<template>
    <FleetReport report="ggm-daily" title="GGM daily" note="Genting van trips and passengers per day, by region (the FOR GGM sheet)." />
</template>
