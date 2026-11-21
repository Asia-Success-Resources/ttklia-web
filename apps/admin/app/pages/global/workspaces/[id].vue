<script setup lang="ts">
// One workspace (v2 Admin\WorkspaceController@edit): what it holds, and its name, timezone and on/off switch.
// GET/PATCH /api/admin/workspaces/{code}. Code, slug and type are fixed. Permission: global.workspaces.read / .write
useHead({ title: 'Workspace' })

interface Workspace { id: number; code: string; slug: string; name: string; type: string; timezone: string; is_active: boolean; staff_count: number; locations_count: number; zones_count: number; orders_count: number }

const route = useRoute()
const code = computed(() => String(route.params.id ?? ''))
const api = useApi()
const { can } = useMe()
const ws = ref<Workspace | null>(null)
const error = ref<string | null>(null)
const toast = useToast()
// The edit popup, fleet-management style (useFormModal / OpsFormModal).
const { form: edit, fieldError, show, submit } = useFormModal(() => ({ name: '', timezone: '', is_active: true }))

const fields = computed(() => [
    { label: 'Code', value: ws.value?.code ?? null },
    { label: 'Address (slug)', value: ws.value?.slug ?? null },
    { label: 'Name', value: ws.value?.name ?? null },
    { label: 'Type', value: ws.value?.type ?? null },
    { label: 'Timezone', value: ws.value?.timezone ?? null },
    { label: 'Active', value: ws.value ? (ws.value.is_active ? 'Yes' : 'No') : null },
    { label: 'Staff', value: ws.value ? String(ws.value.staff_count) : null },
    { label: 'Counters and places', value: ws.value ? String(ws.value.locations_count) : null },
    { label: 'Zones', value: ws.value ? String(ws.value.zones_count) : null },
    { label: 'Orders', value: ws.value ? ws.value.orders_count.toLocaleString('en-MY') : null },
])

async function load() {
    try {
        ws.value = (await api.get<{ data: Workspace }>(`/admin/workspaces/${code.value}`)).data
    } catch (e) {
        error.value = toProblem(e)?.detail ?? 'Unable to load the workspace.'
    }
}
onMounted(load)

function openEdit() {
    if (!ws.value) return
    show({ name: ws.value.name, timezone: ws.value.timezone, is_active: ws.value.is_active })
}
async function save() {
    const saved = await submit((data) => api.patch(`/admin/workspaces/${code.value}`, data))
    if (saved) {
        toast.add({ title: `${edit.data.name} saved`, color: 'success' })
        await load()
    }
}
</script>

<template>
    <OpsDetailPage :title="ws?.name ?? 'Workspace'" :fields="fields">
        <template #actions>
            <div class="flex w-full justify-end">
                <UButton v-if="can('global.workspaces.write') && ws" label="Edit" icon="i-bx-edit" color="success" variant="soft" @click="openEdit" />
            </div>
            <UAlert v-if="error" class="w-full" color="error" variant="soft" :title="error" />
        </template>
    </OpsDetailPage>

    <OpsFormModal v-model:open="edit.open" title="Edit Workspace" :saving="edit.saving" :error="edit.error" submit-label="Save Workspace" @submit="save">
        <OpsFormField label="Name" required :error="fieldError('name')">
            <UInput v-model="edit.data.name" class="w-full" :color="fieldError('name') ? 'error' : undefined" />
        </OpsFormField>
        <OpsFormField label="Timezone" required :error="fieldError('timezone')">
            <UInput v-model="edit.data.timezone" placeholder="Asia/Kuala_Lumpur" class="w-full" :color="fieldError('timezone') ? 'error' : undefined" />
        </OpsFormField>
        <OpsFormField label="Status" :error="fieldError('is_active')">
            <OpsStatusToggle v-model="edit.data.is_active" active-label="Active" inactive-label="Disabled" />
        </OpsFormField>
    </OpsFormModal>
</template>
