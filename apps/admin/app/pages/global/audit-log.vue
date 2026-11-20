<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Audit log: list (table `audit_logs`). Permission: global.audit_log.read (doc 27).
// GET /api/v1/admin/audit-logs (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Audit log' })

interface Row extends Record<string, unknown> {
    uuid: string
    action: string
    subject_type: string
    before: unknown | null
    after: unknown | null
    ip: string | null
    happened_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'action', header: 'Action' },
    { accessorKey: 'subject_type', header: 'Subject type' },
    { accessorKey: 'before', header: 'Before' },
    { accessorKey: 'after', header: 'After' },
    { accessorKey: 'ip', header: 'Ip' },
    { accessorKey: 'happened_at', header: 'Happened at' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/admin/audit-logs' })
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
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
