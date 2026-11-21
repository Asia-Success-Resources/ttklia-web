<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Suppressions: addresses messages are not sent to (table `suppressions`). Only the SHA-256 of the address is kept,
// so the list shows why and until when, never who. Add one by hand; lift a manual or bounce one (a complaint or
// unsubscribe stays: only the person can opt back in). Permission: global.messaging_suppressions.read / write.
useHead({ title: 'Suppressions' })

interface Row extends Record<string, unknown> {
    id: number
    channel: string
    reason: string
    expires_at: string | null
    created_at: string
}

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/messaging/suppressions' })
onMounted(() => list.load())

const { form, fieldError, show, submit } = useFormModal(() => ({ channel: 'email', recipient: '', expires_at: '' }))
async function save() {
    if (await submit((d) => api.post('/admin/messaging/suppressions', { ...d, expires_at: d.expires_at || null }))) {
        toast.add({ title: 'Address suppressed', color: 'success' })
        await list.load()
    }
}
async function lift(row: Row) {
    if (!confirm('Send messages to this address again?')) return
    try {
        await api.del(`/admin/messaging/suppressions/${row.id}`)
        toast.add({ title: 'Suppression lifted', color: 'success' })
        await list.load(list.pagination.value?.current_page ?? 1)
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to lift it', color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'created_at', header: 'Since' },
    { accessorKey: 'channel', header: 'Channel', cell: ({ row }) => statusLabel(row.original.channel) },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => statusLabel(row.original.reason) },
    { accessorKey: 'expires_at', header: 'Until', cell: ({ row }) => (row.original.expires_at ? formatDateTime(row.original.expires_at) : 'Always') },
    actionsColumn<Row>((row) =>
        can('global.messaging_suppressions.write') && !['complaint', 'unsubscribed'].includes(row.reason)
            ? [{ label: 'Lift', icon: 'i-bx-trash', color: 'error', onSelect: () => lift(row) }]
            : [],
    ),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Suppressions"
        subject="suppressions"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('global.messaging_suppressions.write')" label="Create" icon="i-bx-plus" @click="show()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" title="Suppress Address" :saving="form.saving" :error="form.error" submit-label="Suppress" @submit="save">
        <OpsFormField label="Channel" required :error="fieldError('channel')">
            <USelect v-model="form.data.channel" :items="[{ label: 'Email', value: 'email' }, { label: 'WhatsApp', value: 'whatsapp' }, { label: 'SMS', value: 'sms' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField :label="form.data.channel === 'email' ? 'Email' : 'Phone number'" required :error="fieldError('recipient')">
            <UInput v-model="form.data.recipient" :placeholder="form.data.channel === 'email' ? 'name@example.com' : '+60123456789'" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Until (empty = always)" :error="fieldError('expires_at')"><UInput v-model="form.data.expires_at" type="date" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
