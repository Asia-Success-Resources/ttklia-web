<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Settlements: gateway files matched to payments (table `settlements`, doc 06 "Daily checks", doc 25).
// Import the gateway's CSV (reference, amount, fee); a mismatch shows its unmatched lines and can be accepted by hand
// with a reason. Permission: finance.settlements.read / write (doc 27).
// TODO(pending: F1) see doc 30.
// TODO(pending: F2) see doc 30.
useHead({ title: 'Settlements' })

interface Row extends Record<string, unknown> {
    id: number
    gateway: string
    settlement_date: string
    total_sen: number
    fee_sen: number
    status: string
    matched_at: string | null
}
interface Line {
    reference: string
    amount_sen: number
    fee_sen: number
    payment_uuid: string | null
    payment_amount_sen: number | null
    matched: boolean
    problem: string | null
}

const { can } = useMe()
const api = useApi()
const toast = useToast()
const reason = useReasonAction()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/finance/settlements' })
onMounted(() => list.load())

// Import popup (fleet style): gateway, date, CSV file.
const file = ref<File | null>(null)
const { form: importForm, fieldError, show: showImport, submit } = useFormModal(() => ({ gateway: 'fiuu', settlement_date: '' }))
function openImport() {
    file.value = null
    showImport()
}
async function save() {
    const saved = await submit(async (d) => {
        const body = new FormData()
        body.append('gateway', d.gateway)
        body.append('settlement_date', d.settlement_date)
        if (file.value) body.append('file', file.value)
        const res = await api.post<{ data: { status: string; unmatched_count: number } }>('/admin/finance/settlements/import', body)
        toast.add({
            title: res.data.status === 'matched' ? 'Settlement imported, every line matched' : `Imported: ${res.data.unmatched_count} lines do not match`,
            color: res.data.status === 'matched' ? 'success' : 'warning',
        })
    })
    if (saved) await list.load()
}

// The unmatched lines of one settlement.
const detail = ref<{ row: Row; lines: Line[] } | null>(null)
async function openLines(row: Row) {
    try {
        const res = await api.get<{ data: { lines: Line[] } }>(`/admin/finance/settlements/${row.id}`)
        detail.value = { row, lines: res.data.lines }
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to load the lines', color: 'error' })
    }
}
function accept(row: Row) {
    reason.ask({
        title: 'Accept Differences',
        label: 'Why are the differences accepted?',
        submitLabel: 'Mark Matched',
        run: async (text) => {
            await api.post(`/admin/finance/settlements/${row.id}/match`, { reason: text })
            toast.add({ title: 'Settlement marked matched', color: 'success' })
            detail.value = null
            await list.load()
        },
    })
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'settlement_date', header: 'Settlement date' },
    { accessorKey: 'gateway', header: 'Gateway', cell: ({ row }) => statusLabel(row.original.gateway) },
    { accessorKey: 'total_sen', header: 'Total (RM)', cell: ({ row }) => formatSen(row.original.total_sen) },
    { accessorKey: 'fee_sen', header: 'Fee (RM)', cell: ({ row }) => formatSen(row.original.fee_sen) },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'matched_at', header: 'Matched at' },
    actionsColumn<Row>((row) => [
        { label: 'View lines', icon: 'i-bx-list-ul', onSelect: () => openLines(row) },
        ...(row.status === 'mismatch' && can('finance.settlements.write') ? [{ label: 'Accept differences', icon: 'i-bx-check', onSelect: () => accept(row) }] : []),
    ]),
]
const lineColumns: TableColumn<Line>[] = [
    { accessorKey: 'reference', header: 'Reference' },
    { accessorKey: 'amount_sen', header: 'File (RM)', cell: ({ row }) => formatSen(row.original.amount_sen) },
    { accessorKey: 'payment_amount_sen', header: 'Payment (RM)', cell: ({ row }) => (row.original.payment_amount_sen === null ? '—' : formatSen(row.original.payment_amount_sen)) },
    {
        accessorKey: 'problem',
        header: 'Result',
        cell: ({ row }) => (row.original.matched ? 'Matched' : row.original.problem === 'no_payment' ? 'No payment found' : 'Amount differs'),
    },
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Settlements"
        subject="settlements"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-import="can('finance.settlements.write')"
        note="Waiting on: F1, F2 (doc 30)."
        @import="openImport"
        @page="list.load"
    />

    <OpsFormModal v-model:open="importForm.open" title="Import Settlement File" :saving="importForm.saving" :error="importForm.error" submit-label="Import" @submit="save">
        <OpsFormField label="Gateway" required :error="fieldError('gateway')">
            <USelect v-model="importForm.data.gateway" :items="[{ label: 'Fiuu', value: 'fiuu' }, { label: 'Counter terminal', value: 'terminal' }, { label: 'Other', value: 'other' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Settlement date" required :error="fieldError('settlement_date')">
            <UInput v-model="importForm.data.settlement_date" type="date" class="w-full" />
        </OpsFormField>
        <OpsFormField label="CSV file (reference, amount, fee)" required full :error="fieldError('file')">
            <UInput type="file" accept=".csv,text/csv" class="w-full" @change="file = ($event.target as HTMLInputElement).files?.[0] ?? null" />
        </OpsFormField>
    </OpsFormModal>

    <UModal :open="!!detail" :title="detail ? `${statusLabel(detail.row.gateway)} · ${formatDate(detail.row.settlement_date)}` : ''" :ui="{ content: 'sm:max-w-3xl' }" @update:open="(v) => { if (!v) detail = null }">
        <template #body>
            <UTable v-if="detail" :data="detail.lines" :columns="lineColumns" empty="No lines in the file" />
        </template>
    </UModal>
    <OpsReasonModal :action="reason" />
</template>
