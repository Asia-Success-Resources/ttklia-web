<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Audit log: list (table `audit_logs`). Permission: global.audit_log.read (doc 27).
// GET /api/admin/audit-logs (ttklia-api).
useHead({ title: 'Audit log' })

interface Row extends Record<string, unknown> {
    id: number
    action: string
    subject_type: string
    subject_id: number
    user_name: string | null
    changes: { attribute: string; old: unknown; new: unknown }[] | Record<string, unknown> | null
    happened_at: string
}

// One row per change: who, which record, and each field's old → new value (App\Traits\HasAuditTrail).
const describe = (c: Row['changes']) =>
    Array.isArray(c) ? c.map((x) => `${x.attribute}: ${JSON.stringify(x.old)} → ${JSON.stringify(x.new)}`).join('; ') : c ? 'new record' : '-'
const columns: TableColumn<Row>[] = [
    { accessorKey: 'happened_at', header: 'When' },
    { accessorKey: 'user_name', header: 'Who', cell: ({ row }) => row.original.user_name ?? '-' },
    { accessorKey: 'action', header: 'Action' },
    { accessorKey: 'subject_type', header: 'Record', cell: ({ row }) => `${row.original.subject_type} #${row.original.subject_id}` },
    { accessorKey: 'changes', header: 'Changes', cell: ({ row }) => h('span', { class: 'whitespace-normal text-xs' }, describe(row.original.changes)) },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/audit-logs' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Audit log"
        subject="audit log"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
