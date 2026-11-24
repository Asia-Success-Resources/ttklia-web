<script setup lang="ts">
// Teeko reports (ReportController RIDE): rides per day and per driver, for the days picked, with CSV export.
// GET /ops/w/{workspace}/reports/{rides|ride-drivers|driver-source}?from&to, …/export. Permission: ride.reports.read;
// the Driver Source Report ride.reports.driver_source (doc 27, doc 36).
useHead({ title: 'Reports' })
const { can } = useMe()
const tab = ref<'rides' | 'ride-drivers' | 'driver-source'>('rides')
const tabs = computed(() => [
    { label: 'Rides by day', value: 'rides' },
    { label: 'By driver', value: 'ride-drivers' },
    ...(can('ride.reports.driver_source') ? [{ label: 'Driver source', value: 'driver-source' }] : []),
])
</script>

<template>
    <div>
        <UTabs v-model="tab" :items="tabs" :content="false" class="mb-4 w-full max-w-lg" />
        <RideReport v-if="tab === 'rides'" key="rides" report="rides" title="Rides" by-day note="Requests per day and how they ended, rides booked ahead, fares and commission." />
        <DriverSourceReport v-else-if="tab === 'driver-source'" key="source" />
        <RideReport v-else key="drivers" report="ride-drivers" title="Rides by driver" note="Offers, accepted, completed and cancelled rides per driver, with fares and commission." />
    </div>
</template>
