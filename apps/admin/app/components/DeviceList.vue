<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Devices list for Global → Devices and Settings → Kiosks (table `devices`, doc 08 Flow 9, doc 25 "Enrolment").
// Add device: the device is added as pending and a one-time enrolment code (24 hours) is shown once, to type on the
// device. Rename; revoke with a reason (token and certificate end for good).
// GET /api/admin/devices, POST /admin/devices/enrolment-codes, PATCH /admin/devices/{uuid}, POST …/{uuid}/revoke.
const props = defineProps<{ title: string; subject: string; type?: string; writePermission: string }>()

interface Row extends Record<string, unknown> {
    uuid: string
    type: string
    name: string
    status: string
    workspace_code: string | null
    location_name: string | null
    software_version: string | null
    os: string | null
    last_seen_at: string | null
}

const TYPES = [
    { label: 'Kiosk app', value: 'kiosk_app' },
    { label: 'Kiosk agent', value: 'kiosk_agent' },
    { label: 'Gate agent', value: 'gate_agent' },
    { label: 'Turnstile agent', value: 'turnstile_agent' },
    { label: 'Counter agent', value: 'counter_agent' },
    { label: 'Display agent', value: 'display_agent' },
    { label: 'Handheld', value: 'handheld' },
    { label: 'POS till', value: 'pos' },
]

const { can } = useMe()
const api = useApi()
const toast = useToast()
const reason = useReasonAction()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/devices', query: () => ({ type: props.type }) })
onMounted(() => list.load())

const workspaces = useApiAll<{ id: number; code: string; name: string }>({ path: '/admin/workspaces' })
onMounted(() => workspaces.load())
const workspaceItems = computed(() => workspaces.rows.value.map((w) => ({ label: `${w.code} · ${w.name}`, value: w.id })))

// Add device, then show its code.
const code = ref<{ name: string; code: string; expires: string } | null>(null)
const { form: add, fieldError, show: showAdd, submit } = useFormModal(() => ({ workspace_id: undefined as number | undefined, type: props.type ?? 'kiosk_app', name: '' }))
async function saveAdd() {
    await submit(async (d) => {
        const res = await api.post<{ data: { name: string; enrolment_code: string; code_expires_at: string } }>('/admin/devices/enrolment-codes', d)
        code.value = { name: res.data.name, code: res.data.enrolment_code, expires: res.data.code_expires_at }
    })
    await list.load()
}

const { form: rename, fieldError: renameError, show: showRename, submit: submitRename } = useFormModal(() => ({ uuid: '', name: '' }))
async function saveRename() {
    if (await submitRename((d) => api.patch(`/admin/devices/${d.uuid}`, { name: d.name }))) {
        toast.add({ title: 'Device renamed', color: 'success' })
        await list.load(list.pagination.value?.current_page ?? 1)
    }
}

function revoke(row: Row) {
    reason.ask({
        title: `Revoke ${row.name}`,
        submitLabel: 'Revoke',
        run: async (text) => {
            await api.post(`/admin/devices/${row.uuid}/revoke`, { reason: text })
            toast.add({ title: `${row.name} revoked`, color: 'success' })
            await list.load(list.pagination.value?.current_page ?? 1)
        },
    })
}

const online = (row: Row) => !!row.last_seen_at && Date.now() - new Date(row.last_seen_at).getTime() < 2 * 60 * 1000
const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => statusLabel(row.original.type) },
    { accessorKey: 'workspace_code', header: 'Workspace' },
    { accessorKey: 'location_name', header: 'Location' },
    { accessorKey: 'software_version', header: 'Version' },
    { accessorKey: 'last_seen_at', header: 'Last seen', cell: ({ row }) => (online(row.original) ? 'Online' : formatDateTime(row.original.last_seen_at)) },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) =>
        can(props.writePermission) && row.status !== 'revoked'
            ? [
                  { label: 'Rename', icon: 'i-bx-edit', onSelect: () => showRename({ uuid: row.uuid, name: row.name }) },
                  { label: 'Revoke', icon: 'i-bx-block', color: 'error', onSelect: () => revoke(row) },
              ]
            : [],
    ),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        :title="props.title"
        :subject="props.subject"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can(props.writePermission)" label="Add device" icon="i-bx-plus" @click="code = null; showAdd()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="add.open" :title="code ? 'Enrolment Code' : 'Add Device'" :saving="add.saving" :error="add.error" :submit-label="code ? 'Done' : 'Get Enrolment Code'" @submit="code ? (add.open = false) : saveAdd()">
        <template v-if="!code">
            <OpsFormField label="Name" required full :error="fieldError('name')"><UInput v-model="add.data.name" placeholder="KL2 kiosk 3" class="w-full" /></OpsFormField>
            <OpsFormField label="Workspace" required :error="fieldError('workspace_id')">
                <USelectMenu v-model="add.data.workspace_id" :items="workspaceItems" value-key="value" class="w-full" />
            </OpsFormField>
            <OpsFormField label="Type" required :error="fieldError('type')"><USelect v-model="add.data.type" :items="TYPES" class="w-full" /></OpsFormField>
        </template>
        <div v-else class="space-y-2 sm:col-span-2">
            <p>Type this code on <b>{{ code.name }}</b> to enrol it. It works once, until {{ formatDateTime(code.expires) }}.</p>
            <p class="rounded-lg bg-(--app-icon-bg) py-4 text-center font-mono text-3xl tracking-[0.3em]">{{ code.code }}</p>
            <p class="text-xs text-gray-500">The code is shown only now.</p>
        </div>
    </OpsFormModal>

    <OpsFormModal v-model:open="rename.open" title="Rename Device" :saving="rename.saving" :error="rename.error" submit-label="Save" @submit="saveRename">
        <OpsFormField label="Name" required full :error="renameError('name')"><UInput v-model="rename.data.name" class="w-full" /></OpsFormField>
    </OpsFormModal>
    <OpsReasonModal :action="reason" />
</template>
