<script setup lang="ts">
// Sales reports by day, product, cashier or method (Sitemap 6). API: GET /vendor-portal/o/{outlet}/reports/sales (doc 32). Permission: vendor.reports.read.
// TODO(api): values stay empty ("—") until the endpoint answers.
useHead({ title: 'Reports' })
const series = [{ name: 'This week', data: [] as number[] }]
</script>

<template>
    <div>
        <OpsBreadcrumb title="Reports" />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
            <OpsMetricCard label="Sales" :value="null" :money="true" icon="i-bx-wallet" />
            <OpsMetricCard label="Orders" :value="null" icon="i-bx-receipt" />
            <OpsMetricCard label="Refunds" :value="null" :money="true" icon="i-bx-arrow-left" />
            <OpsMetricCard label="Average basket" :value="null" :money="true" icon="i-bx-cart" />
        </div>
        <div class="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2 md:gap-6">
            <OpsChartCard title="This week" :series="series" />
            <OpsListCard title="Latest" :items="[]" />
        </div>
    </div>
</template>
