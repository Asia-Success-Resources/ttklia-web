<script setup lang="ts">
// Global: Fleet-style dashboard (doc 09, "Dashboard"): four metric cards, then chart and list cards.
// TODO(api): doc 04 has no dashboard endpoint yet; values stay empty ("—") until it does.
useHead({ title: 'Dashboard' })
const series = [{ name: 'This week', data: [] as number[] }]
</script>

<template>
    <div>
        <OpsBreadcrumb title="Global" />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
            <OpsMetricCard label="Workspaces" :value="null" icon="i-bx-buildings" />
            <OpsMetricCard label="Staff users" :value="null" icon="i-bx-group" />
            <OpsMetricCard label="Customers" :value="null" icon="i-bx-user" />
            <OpsMetricCard label="Open privacy requests" :value="null" icon="i-bx-shield" />
        </div>
        <div class="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2 md:gap-6">
            <OpsChartCard title="This week" :series="series" />
            <OpsListCard title="Latest" :items="[]" />
        </div>
    </div>
</template>
