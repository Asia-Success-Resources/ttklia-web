<script setup lang="ts">
// Reports: report. Permission: ride.reports.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
useHead({ title: 'Reports' })
const series = [{ name: 'Reports', data: [] as number[] }]
</script>

<template>
    <div>
        <OpsBreadcrumb title="Reports" />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
            <OpsMetricCard label="Count" :value="null" icon="i-bx-hashtag" />
            <OpsMetricCard label="Amount" :value="null" money icon="i-bx-wallet" />
        </div>
        <div class="mt-6 grid grid-cols-1 gap-4 md:gap-6">
            <OpsChartCard title="Reports" :series="series" />
        </div>
    </div>
</template>
