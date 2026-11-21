<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// E-invoices: MyInvois (table `einvoices`, doc 26). Permission: finance.einvoices.read / write (doc 27).
// Resubmit puts one back in the queue; cancel works within 72 hours of validation, with a reason; View opens the
// validated copy on MyInvois.
// TODO(pending: F6) see doc 30.
// TODO(pending: G4) see doc 30.
useHead({ title: 'E-Invoices' })

interface Row extends Record<string, unknown> {
    uuid: string
    source_type: string
    document_type: string
    buyer_tin: string | null
    total_sen: number
    sst_sen: number
    status: string
    submitted_at: string | null
    validated_at: string | null
    myinvois_uuid: string | null
}

const { can } = useMe()
const api = useApi()
const toast = useToast()
const reason = useReasonAction()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/finance/einvoices' })
onMounted(() => list.load())

const within72h = (row: Row) => row.status === 'valid' && !!row.validated_at && Date.now() - new Date(row.validated_at).getTime() < 72 * 3600 * 1000

async function resubmit(row: Row) {
    try {
        await api.post(`/admin/finance/einvoices/${row.uuid}/submit`)
        toast.add({ title: 'E-invoice queued for MyInvois', color: 'success' })
        await list.load()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to submit', color: 'error' })
    }
}
function cancel(row: Row) {
    reason.ask({
        title: 'Cancel E-invoice',
        submitLabel: 'Cancel E-invoice',
        run: async (text) => {
            await api.post(`/admin/finance/einvoices/${row.uuid}/cancel`, { reason: text })
            toast.add({ title: 'E-invoice cancelled', color: 'success' })
            await list.load()
        },
    })
}
async function view(row: Row) {
    try {
        const res = await api.get<{ data: { url: string } }>(`/admin/finance/einvoices/${row.uuid}/pdf`)
        window.open(res.data.url, '_blank', 'noopener')
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'No validated copy yet', color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'created_at', header: 'Created' },
    { accessorKey: 'document_type', header: 'Document', cell: ({ row }) => statusLabel(row.original.document_type) },
    { accessorKey: 'source_type', header: 'For', cell: ({ row }) => statusLabel(row.original.source_type) },
    { accessorKey: 'buyer_tin', header: 'Buyer TIN' },
    { accessorKey: 'total_sen', header: 'Total (RM)', cell: ({ row }) => formatSen(row.original.total_sen) },
    { accessorKey: 'sst_sen', header: 'SST (RM)', cell: ({ row }) => formatSen(row.original.sst_sen) },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => [
        ...(row.status === 'valid' ? [{ label: 'View on MyInvois', icon: 'i-bx-arrow-out-up-right-square', onSelect: () => view(row) }] : []),
        ...(['pending', 'invalid', 'submitted'].includes(row.status) && can('finance.einvoices.write')
            ? [{ label: 'Submit again', icon: 'i-bx-refresh-cw', onSelect: () => resubmit(row) }]
            : []),
        ...(within72h(row) && can('finance.einvoices.write') ? [{ label: 'Cancel', icon: 'i-bx-x', color: 'error' as const, onSelect: () => cancel(row) }] : []),
    ]),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="E-Invoices"
        subject="e-invoices"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        note="Waiting on: F6, G4 (doc 30). Sending to MyInvois starts once the adapter is in place."
        @page="list.load"
    />
    <OpsReasonModal :action="reason" />
</template>
