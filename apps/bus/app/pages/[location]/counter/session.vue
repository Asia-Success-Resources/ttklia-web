<script setup lang="ts">
// Counter: session: takings and variance (table `cash_sessions`). Permission: bus.counter_session.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

definePageMeta({ layout: 'counter' })

const route = useRoute()
const id = computed(() => String(route.params.id ?? route.params.uuid ?? ''))

// Empty until the API answers; never fake values.
const fields: { label: string; value: string | null }[] = [
  { label: 'Opened at', value: null },
  { label: 'Closed at', value: null },
  { label: 'Opening float sen', value: null },
  { label: 'Expected sen', value: null },
  { label: 'Counted sen', value: null },
  { label: 'Variance sen', value: null },
  { label: 'Approved by', value: null },
  { label: 'Created at', value: null }
]
</script>

<template>
  <OpsDetailPage :title="`Counter: session ${id}`" :fields="fields">
    <template #actions>
      <UButton label="Edit" icon="i-bx-edit" color="success" variant="soft" disabled />
    </template>
  </OpsDetailPage>
</template>
