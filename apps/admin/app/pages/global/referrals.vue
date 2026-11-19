<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Referrals: codes, uses, staff and customer (table `referral_codes`). Permission: global.referrals.read (doc 27).
// TODO(pending: R3) see doc 30.
// TODO(pending: R4) see doc 30.
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  code: string
  kind: string
  uses_count: number
  status: string
  created_at: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'kind', header: 'Kind' },
  { accessorKey: 'uses_count', header: 'Uses count' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Referrals"
    subject="referrals"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    note="Waiting on: R3, R4 (doc 30)."
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
