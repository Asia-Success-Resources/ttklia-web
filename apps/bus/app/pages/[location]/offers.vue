<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Offers: promotions (table `promotions`). Permission: bus.offers.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  code: string
  product: string | null
  type: string
  value: number
  max_uses: number | null
  max_uses_per_user: number | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'value', header: 'Value' },
  { accessorKey: 'max_uses', header: 'Max uses' },
  { accessorKey: 'max_uses_per_user', header: 'Max uses per user' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Offers"
    subject="offers"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
