<script setup lang="ts">
// Taxi: Fleet-style dashboard (doc 09, "Dashboard"): four metric cards, then chart and list cards.
// TODO(api): doc 04 has no dashboard endpoint yet; values stay empty ("—") until it does.
const series = [{ name: 'This week', data: [] as number[] }]
</script>

<template>
  <div>
    <OpsBreadcrumb title="Taxi" />
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      <OpsMetricCard label="Coupons today" :value="null" icon="i-bx-receipt" />
      <OpsMetricCard label="Sales today" :value="null" :money="true" icon="i-bx-wallet" />
      <OpsMetricCard label="Tickets in queue" :value="null" icon="i-bx-list-ol" />
      <OpsMetricCard label="Forfeited today" :value="null" icon="i-bx-alert-circle" />
    </div>
    <div class="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2 md:gap-6">
      <OpsChartCard title="This week" :series="series" />
      <OpsListCard title="Latest" :items="[]" />
    </div>
  </div>
</template>
