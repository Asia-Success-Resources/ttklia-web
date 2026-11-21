<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Pickup queue: the live e-hailing queue per zone at KL2 Door 5 (tables `pickup_zones`, `pickup_queue_entries`; doc 33).
// Permission: ride.pickup_queue.read; removing a car needs ride.pickup_queue.write and a reason (logged).
// GET /api/ops/w/{workspace}/pickup-queue, POST …/pickup-queue/{id}/remove (ttklia-api). TODO(api): both are stubs.
// TODO(pending: E1, E2, E3) what feeds the queue, what the zones are, and when a car leaves it (doc 30).
useHead({ title: 'Pickup queue' })

interface Row extends Record<string, unknown> {
    id: number
    position: number
    zone: string
    plate_normalised: string
    arrived_at: string
    status: string
}

const UButton = resolveComponent('UButton')
const api = useApi()
const { slug } = useWorkspace()
const toast = useToast()

const search = ref('')
const list = useApiList<Row>({ search, path: '/pickup-queue', workspaceScoped: true })
onMounted(() => list.load())

// Live updates: the queue screens listen on `queue.{location}` (doc 10); this page reloads by hand for now.
// TODO(api): subscribe to `queue.entry_added`, `queue.entry_left`, `queue.entry_removed` once Echo is wired.

const removing = ref<Row | null>(null)
const reason = ref('')
const saving = ref(false)

async function confirmRemove() {
    if (!removing.value || !slug.value || !reason.value.trim()) return
    saving.value = true
    try {
        await api.post(api.workspacePath(slug.value, `/pickup-queue/${removing.value.id}/remove`), { reason: reason.value.trim() })
        toast.add({ title: `${removing.value.plate_normalised} taken off the queue`, color: 'success' })
        removing.value = null
        reason.value = ''
        await list.load()
    } catch (err) {
        toast.add({ title: toProblem(err)?.detail ?? 'Could not remove the car', color: 'error' })
    } finally {
        saving.value = false
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'position', header: '#' },
    { accessorKey: 'zone', header: 'Zone' },
    { accessorKey: 'plate_normalised', header: 'Plate' },
    { accessorKey: 'arrived_at', header: 'Arrived at' },
    { accessorKey: 'status', header: 'Status' },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => h(UButton, {
            label: 'Remove',
            size: 'xs',
            color: 'error',
            variant: 'outline',
            onClick: () => { removing.value = row.original },
        }),
    },
]
</script>

<template>
    <div>
        <OpsListPage
            v-model:search="search"
            title="Pickup queue"
            subject="pickup queue"
            :rows="list.rows.value"
            :columns="columns"
            :loading="list.pending.value"
            :pagination="list.pagination.value"
            :can-export="false"
            @page="list.load"
        >
            <template #actions>
                <UButton label="Refresh" icon="i-bx-refresh-cw" color="neutral" variant="outline" @click="list.load()" />
            </template>
        </OpsListPage>

        <UModal :open="removing !== null" title="Take this car off the queue?" @update:open="(open: boolean) => { if (!open) removing = null }">
            <template #body>
                <p class="mb-3 text-sm text-gray-500">
                    {{ removing?.plate_normalised }} in zone {{ removing?.zone }}. The reason is logged.
                </p>
                <UFormField label="Reason" name="reason" required>
                    <UInput v-model="reason" placeholder="Wrong read, car gone…" maxlength="190" class="w-full" />
                </UFormField>
            </template>
            <template #footer>
                <UButton label="Cancel" color="neutral" variant="outline" @click="removing = null" />
                <UButton label="Remove" color="error" :loading="saving" :disabled="!reason.trim()" @click="confirmRemove" />
            </template>
        </UModal>
    </div>
</template>
