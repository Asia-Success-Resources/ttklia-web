<script setup lang="ts">
// Trips: timeline and seat map (table `bus_trips`). Permission: bus.trips.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
// TODO(api): seat map from GET /bus/trips/{uuid}/seats; events from bus_trip_events (doc 04, doc 21).

const route = useRoute()
const id = computed(() => String(route.params.id ?? route.params.uuid ?? ''))

// Empty until the API answers; never fake values.
const fields: { label: string; value: string | null }[] = [
  { label: 'Uuid', value: null },
  { label: 'Direction', value: null },
  { label: 'Source', value: null },
  { label: 'Trip no', value: null },
  { label: 'Sales open', value: null },
  { label: 'Seats synced at', value: null },
  { label: 'Capacity', value: null },
  { label: 'Scheduled departure at', value: null },
  { label: 'Estimated departure at', value: null },
  { label: 'Origin departure at', value: null }
]
</script>

<template>
  <OpsDetailPage :title="`Trips ${id}`" :fields="fields">
    <template #actions>
      <UButton label="Edit" icon="i-bx-edit" color="success" variant="soft" disabled />
    </template>
  </OpsDetailPage>
</template>
