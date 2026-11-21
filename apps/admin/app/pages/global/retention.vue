<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Retention: how long each kind of data is kept, then deleted or masked (table `retention_policies`, doc 26).
// The PurgeByRetentionPolicy job applies them. Permission: global.retention.read / write.
useHead({ title: 'Retention' })

interface Row extends Record<string, unknown> {
    id: number
    data_class: string
    keep_days: number
    action: string
    updated_at: string
}

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/retention-policies' })
onMounted(() => list.load())

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({ data_class: '', keep_days: '', action: 'delete' }))
function open(row?: Row) {
    editing.value = row ?? null
    show(row ? { data_class: row.data_class, keep_days: String(row.keep_days), action: row.action } : {})
}
async function save() {
    const saved = await submit(async (d) => {
        const body = { keep_days: Number(d.keep_days), action: d.action }
        if (editing.value) await api.patch(`/admin/retention-policies/${editing.value.id}`, body)
        else await api.post('/admin/retention-policies', { ...body, data_class: d.data_class })
    })
    if (saved) {
        toast.add({ title: 'Retention saved', color: 'success' })
        await list.load()
    }
}

/** 2555 days → "7 years", 30 → "30 days". */
function readable(days: number): string {
    if (days % 365 === 0 || days % 365 < 3) return `${Math.round(days / 365)} year${Math.round(days / 365) === 1 ? '' : 's'}`
    return `${days} days`
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'data_class', header: 'Data', cell: ({ row }) => statusLabel(row.original.data_class) },
    { accessorKey: 'keep_days', header: 'Kept for', cell: ({ row }) => (row.original.keep_days >= 365 ? readable(row.original.keep_days) : `${row.original.keep_days} days`) },
    { accessorKey: 'action', header: 'Then', cell: ({ row }) => (row.original.action === 'mask' ? 'Masked' : 'Deleted') },
    { accessorKey: 'updated_at', header: 'Changed' },
    actionsColumn<Row>((row) => (can('global.retention.write') ? [{ label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) }] : [])),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Retention"
        subject="retention policies"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('global.retention.write')" label="Create" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Retention' : 'New Retention'" :saving="form.saving" :error="form.error" submit-label="Save" @submit="save">
        <OpsFormField label="Data (table or kind)" required full :error="fieldError('data_class')">
            <UInput v-model="form.data.data_class" placeholder="message_logs" :disabled="!!editing" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Keep for (days)" required :error="fieldError('keep_days')"><UInput v-model="form.data.keep_days" type="number" min="1" class="w-full" /></OpsFormField>
        <OpsFormField label="Then" required :error="fieldError('action')">
            <USelect v-model="form.data.action" :items="[{ label: 'Delete', value: 'delete' }, { label: 'Mask personal fields', value: 'mask' }]" class="w-full" />
        </OpsFormField>
    </OpsFormModal>
</template>
