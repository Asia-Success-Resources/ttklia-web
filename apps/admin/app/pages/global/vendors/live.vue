<script setup lang="ts">
// Vendors live: tills open, sales today, offline tills (Sitemap 6, doc 32). Permission: vendors.manage. TODO(api): doc 04 has no endpoint yet.
// TODO(api): values stay empty ("—") until the endpoint answers.
const series = [{ name: 'This week', data: [] as number[] }]
</script>

<template>
  <div>
    <OpsBreadcrumb title="Vendor tills" />
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      <OpsMetricCard label="Tills open" :value="null" icon="i-bx-store" />
      <OpsMetricCard label="Sales today" :value="null" :money="true" icon="i-bx-wallet" />
      <OpsMetricCard label="Tills offline" :value="null" icon="i-bx-wifi-slash" />
      <OpsMetricCard label="Outlets active" :value="null" icon="i-bx-buildings" />
    </div>
    <div class="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2 md:gap-6">
      <OpsChartCard title="This week" :series="series" />
      <OpsListCard title="Latest" :items="[]" />
    </div>
  </div>
</template>
