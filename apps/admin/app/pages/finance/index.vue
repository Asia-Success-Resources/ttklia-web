<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Ledger: ledger (table `journal_entries`). Permission: finance.ledger.read (doc 27).
// TODO(pending: F3) see doc 30.
// GET /api/admin/finance/ledger (ttklia-api).
useHead({ title: 'Ledger' })

interface Row extends Record<string, unknown> {
    uuid: string
    entry_type: string
    reference_type: string | null
    memo: string | null
    posted_at: string
}
interface Line {
    code: string
    type: string
    purpose: string
    debit_sen: number
    credit_sen: number
}
interface Entry extends Row {
    workspace_code: string | null
    posted_by_name: string | null
    reverses: string | null
    reversed_by: string | null
    lines: Line[]
}

// One entry's lines (debits = credits), and what it reverses or is reversed by.
const api = useApi()
const toast = useToast()
const entry = ref<Entry | null>(null)
async function view(uuid: string) {
    try {
        entry.value = (await api.get<{ data: Entry }>(`/admin/finance/ledger/${uuid}`)).data
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to open the entry', color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'posted_at', header: 'Posted' },
    { accessorKey: 'entry_type', header: 'Entry', cell: ({ row }) => statusLabel(row.original.entry_type) },
    { accessorKey: 'reference_type', header: 'For', cell: ({ row }) => statusLabel(row.original.reference_type) },
    { accessorKey: 'memo', header: 'Memo' },
    actionsColumn<Row>((row) => [{ label: 'View lines', icon: 'i-bx-list-ul', onSelect: () => view(row.uuid) }]),
]
const lineColumns: TableColumn<Line>[] = [
    { accessorKey: 'code', header: 'Account' },
    { accessorKey: 'purpose', header: 'What', cell: ({ row }) => statusLabel(row.original.purpose) },
    { accessorKey: 'debit_sen', header: 'Debit (RM)', cell: ({ row }) => (row.original.debit_sen ? formatSen(row.original.debit_sen) : '') },
    { accessorKey: 'credit_sen', header: 'Credit (RM)', cell: ({ row }) => (row.original.credit_sen ? formatSen(row.original.credit_sen) : '') },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/finance/ledger' })
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
        :pagination="list.pagination.value"
        note="Waiting on: F3 (doc 30)."
        @page="list.load"
    />

    <UModal :open="!!entry" :title="entry ? `${statusLabel(entry.entry_type)} · ${formatDateTime(entry.posted_at)}` : ''" :ui="{ content: 'sm:max-w-3xl' }" @update:open="(v) => { if (!v) entry = null }">
        <template #body>
            <div v-if="entry" class="space-y-3 text-sm">
                <p>
                    {{ entry.workspace_code }} · posted by {{ entry.posted_by_name ?? 'the system' }}<span v-if="entry.memo"> · {{ entry.memo }}</span>
                </p>
                <p v-if="entry.reverses" class="text-gray-500">Reverses entry {{ entry.reverses }}</p>
                <p v-if="entry.reversed_by" class="text-gray-500">Reversed by entry {{ entry.reversed_by }}</p>
                <UTable :data="entry.lines" :columns="lineColumns" />
            </div>
        </template>
    </UModal>
</template>
