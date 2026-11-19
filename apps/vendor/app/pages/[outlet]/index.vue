<script setup lang="ts">
// Vendor dashboard: today's sales, top products, low stock (Sitemap 6, doc 32). Permission: vendor.reports.read.
// TODO(api): values stay empty ("—") until the endpoint answers.
const series = [{ name: 'This week', data: [] as number[] }]
</script>

<template>
  <div>
    <OpsBreadcrumb title="Vendor" />
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      <OpsMetricCard label="Sales today" :value="null" :money="true" icon="i-bx-wallet" />
      <OpsMetricCard label="Orders today" :value="null" icon="i-bx-receipt" />
      <OpsMetricCard label="Products low on stock" :value="null" icon="i-bx-package" />
      <OpsMetricCard label="Open till shifts" :value="null" icon="i-bx-store" />
    </div>
    <div class="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2 md:gap-6">
      <OpsChartCard title="This week" :series="series" />
      <OpsListCard title="Latest" :items="[]" />
    </div>
  </div>
</template>
