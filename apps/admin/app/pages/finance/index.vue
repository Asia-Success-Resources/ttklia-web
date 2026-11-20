<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Ledger: ledger (table `journal_entries`). Permission: finance.ledger.read (doc 27).
// TODO(pending: F3) see doc 30.
// GET /api/v1/admin/finance/ledger (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Ledger' })

interface Row extends Record<string, unknown> {
    uuid: string
    entry_type: string
    reference_type: string | null
    memo: string | null
    posted_by: number | null
    posted_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'entry_type', header: 'Entry type' },
    { accessorKey: 'reference_type', header: 'Reference type' },
    { accessorKey: 'memo', header: 'Memo' },
    { accessorKey: 'posted_by', header: 'Posted by' },
    { accessorKey: 'posted_at', header: 'Posted at' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/admin/finance/ledger' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Ledger"
        subject="ledger"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        note="Waiting on: F3 (doc 30)."
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
