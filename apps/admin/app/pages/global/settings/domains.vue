<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Domains: which host opens which app (table `app_domains`, doc 16 "Which app"), the public site's brand (doc 09),
// redirects from old addresses, and a DNS check. One primary host per app. Permission: global.settings_domains.read / write.
useHead({ title: 'Domains' })

interface Row extends Record<string, unknown> {
    id: number
    host: string
    app: string
    brand: string
    redirect_to: string | null
    is_primary: boolean
    tls_status: string
    verified_at: string | null
}

const appItems: { label: string; value: string }[] = ['public', 'bus', 'taxi', 'fleet', 'ride', 'admin', 'operator', 'vendor', 'api', 'auth'].map((a) => ({
    label: a === 'ride' ? 'ride (Teeko)' : a,
    value: a,
}))

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/settings/domains' })
onMounted(() => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const editing = ref<Row | null>(null)
const { form: dom, fieldError, show, submit } = useFormModal(() => ({ host: '', app: 'public', brand: 'ttklia', redirectTo: '', isPrimary: false, tlsStatus: 'pending' }))
function openForm(row?: Row) {
    editing.value = row ?? null
    show(row ? { host: row.host, app: row.app, brand: row.brand, redirectTo: row.redirect_to ?? '', isPrimary: row.is_primary, tlsStatus: row.tls_status } : {})
}
async function save() {
    const saved = await submit(async (d) => {
        const body = { host: d.host, app: d.app, brand: d.brand, redirect_to: d.redirectTo || null, is_primary: d.isPrimary, tls_status: d.tlsStatus }
        if (editing.value) await api.patch(`/admin/settings/domains/${editing.value.id}`, body)
        else await api.post('/admin/settings/domains', body)
    })
    if (saved) {
        toast.add({ title: `${dom.data.host} saved`, color: 'success' })
        await reload()
    }
}
async function check(row: Row) {
    try {
        const res = await api.get<{ data: { dns_resolves: boolean; dns_answers: string[] } }>(`/admin/settings/domains/${row.id}/status`)
        toast.add({
            title: res.data.dns_resolves ? `${row.host} points to ${res.data.dns_answers.join(', ')}` : `${row.host} does not resolve yet`,
            color: res.data.dns_resolves ? 'success' : 'warning',
        })
        await reload()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to check', color: 'error' })
    }
}
async function remove(row: Row) {
    if (!confirm(`Remove ${row.host}?`)) return
    try {
        await api.del(`/admin/settings/domains/${row.id}`)
        toast.add({ title: `${row.host} removed`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to remove it', color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'host', header: 'Host' },
    { accessorKey: 'app', header: 'App', cell: ({ row }) => (row.original.app === 'ride' ? 'ride (Teeko)' : row.original.app) },
    { accessorKey: 'brand', header: 'Brand' },
    { accessorKey: 'redirect_to', header: 'Redirects to', cell: ({ row }) => row.original.redirect_to ?? '—' },
    { accessorKey: 'is_primary', header: 'Primary', cell: ({ row }) => (row.original.is_primary ? 'Yes' : '') },
    { accessorKey: 'tls_status', header: 'Certificate' },
    { accessorKey: 'verified_at', header: 'DNS verified' },
    actionsColumn<Row>((row) => [
        { label: 'Check DNS', icon: 'i-bx-refresh-cw', onSelect: () => check(row) },
        ...(can('global.settings_domains.write')
            ? [
                  { label: 'Edit', icon: 'i-bx-edit', onSelect: () => openForm(row) },
                  ...(!row.is_primary ? [{ label: 'Remove', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) }] : []),
              ]
            : []),
    ]),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Domains"
        subject="domains"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('global.settings_domains.write')" label="Create" icon="i-bx-plus" @click="openForm()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="dom.open" :title="editing ? 'Edit Domain' : 'Add Domain'" :saving="dom.saving" :error="dom.error" submit-label="Save Domain" @submit="save">
        <OpsFormField label="Host" required full :error="fieldError('host')">
            <UInput v-model="dom.data.host" placeholder="teeko.ttklia.com" :disabled="!!editing" class="w-full" />
        </OpsFormField>
        <OpsFormField label="App" required :error="fieldError('app')">
            <USelect v-model="dom.data.app" :items="appItems" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Brand (public site only)" :error="fieldError('brand')">
            <USelect v-model="dom.data.brand" :disabled="dom.data.app !== 'public'" :items="[{ label: 'TTKLIA', value: 'ttklia' }, { label: 'Teeko', value: 'teeko' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Redirect to (old address only)" full :error="fieldError('redirect_to')">
            <UInput v-model="dom.data.redirectTo" placeholder="bus.ttklia.com/lalaport, with https" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Certificate" :error="fieldError('tls_status')">
            <USelect v-model="dom.data.tlsStatus" :items="[{ label: 'Pending', value: 'pending' }, { label: 'Issued', value: 'issued' }, { label: 'Failed', value: 'failed' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Primary host for the app" :error="fieldError('is_primary')">
            <OpsStatusToggle v-model="dom.data.isPrimary" active-label="Primary" inactive-label="Other host" />
        </OpsFormField>
    </OpsFormModal>
</template>
