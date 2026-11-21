<script setup lang="ts">
// One vehicle: details, documents (insurance, road tax, permit… add or renew), its last issues and services.
// GET /vehicles/{id}, POST /documents, PATCH /documents/{id}. Permission: fleet.vehicles.read / write (doc 27).
interface Doc { id: number; type: string; number: string | null; issued_on: string | null; expires_on: string | null; status: string }
interface Vehicle extends Record<string, unknown> {
    id: number
    plate_no: string
    type: string
    vehicle_class: string
    make: string | null
    model: string | null
    year: number | null
    seats: number | null
    colour: string | null
    condition_grade: string | null
    toll_class: number | null
    odometer_km: number | null
    status: string
    organisation_name: string | null
    jobs_30d: number
    documents: Doc[]
    issues: { id: number; reported_at: string; description: string; blocks_use: boolean; status: string }[]
    services: { id: number; done_on: string; odometer_km: number; vendor: string | null; cost_sen: number | null; notes: string | null }[]
}

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.vehicles.write'))
const vehicle = ref<Vehicle | null>(null)
const error = ref<string | null>(null)
useHead({ title: () => vehicle.value?.plate_no ?? 'Vehicle' })

async function load() {
    try {
        vehicle.value = (await api.get<{ data: Vehicle }>(`/vehicles/${id.value}`)).data
    } catch (e) {
        error.value = fleetError(e, 'Unable to load the vehicle.')
    }
}
onMounted(load)

const fields = computed(() => {
    const v = vehicle.value
    if (!v) return []
    return [
        { label: 'Plate', value: v.plate_no }, { label: 'Class', value: `${statusLabel(v.vehicle_class)} · ${v.type}` },
        { label: 'Make and model', value: [v.make, v.model, v.year].filter(Boolean).join(' ') || null }, { label: 'Seats', value: v.seats ? String(v.seats) : null },
        { label: 'Colour', value: v.colour }, { label: 'Condition', value: v.condition_grade ? statusLabel(v.condition_grade) : null },
        { label: 'Toll class', value: v.toll_class ? String(v.toll_class) : null }, { label: 'Odometer', value: v.odometer_km ? `${v.odometer_km.toLocaleString('en-MY')} km` : null },
        { label: 'Owner', value: v.organisation_name }, { label: 'Jobs (30 days)', value: String(v.jobs_30d) }, { label: 'Status', value: statusLabel(v.status) },
    ]
})

const DOC_TYPES = ['insurance', 'road_tax', 'permit', 'puspakom', 'registration_card'].map((t) => ({ label: statusLabel(t), value: t }))
const { form, fieldError, show, submit } = useFormModal(() => ({ id: 0, type: 'insurance', number: '', issued_on: '', expires_on: '' }))
async function saveDoc() {
    const saved = await submit(async (d) => {
        const body = { number: d.number || null, issued_on: d.issued_on || null, expires_on: d.expires_on || null }
        if (d.id) await api.patch(`/documents/${d.id}`, body)
        else await api.post('/documents', { ...body, owner: 'vehicle', owner_id: vehicle.value!.id, type: d.type })
    })
    if (saved) {
        toast.add({ title: 'Document saved', color: 'success' })
        await load()
    }
}
const today = todayYmd()
</script>

<template>
    <OpsDetailPage :title="vehicle?.plate_no ?? 'Vehicle'" :fields="fields">
        <template #actions>
            <UAlert v-if="error" class="w-full" color="error" variant="soft" :title="error" />
            <UButton label="Report issue" icon="i-bx-spanner" color="warning" variant="soft" :to="`/vehicles/issues?vehicle=${id}`" />
            <UButton label="Back" icon="i-bx-arrow-left-stroke" color="neutral" variant="ghost" to="/vehicles" />
        </template>
        <template #body>
            <div v-if="vehicle" class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
                <div class="mb-3 flex items-center justify-between">
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">Documents</h4>
                    <UButton v-if="canWrite" label="Add document" icon="i-bx-plus" size="sm" @click="show()" />
                </div>
                <p v-if="!vehicle.documents.length" class="text-sm text-gray-500">No documents.</p>
                <table v-else class="w-full text-sm">
                    <thead class="text-left text-xs uppercase text-gray-500"><tr><th class="py-2">Document</th><th>Number</th><th>Expires</th><th>Status</th><th /></tr></thead>
                    <tbody>
                        <tr v-for="d in vehicle.documents" :key="d.id" class="border-t border-(--ops-border)">
                            <td class="py-2">{{ statusLabel(d.type) }}</td>
                            <td>{{ d.number ?? '—' }}</td>
                            <td :class="d.expires_on && d.expires_on < today ? 'font-medium text-error' : ''">{{ formatDate(d.expires_on) || '—' }}</td>
                            <td>{{ statusLabel(d.status) }}</td>
                            <td class="text-right"><UButton v-if="canWrite" label="Renew" size="xs" variant="ghost" @click="show({ id: d.id, type: d.type, number: d.number ?? '', issued_on: d.issued_on ?? '', expires_on: d.expires_on ?? '' })" /></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="vehicle" class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
                <h4 class="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">Services</h4>
                <p v-if="!vehicle.services.length" class="text-sm text-gray-500">No services recorded.</p>
                <div v-for="s in vehicle.services" :key="s.id" class="flex justify-between gap-3 border-t border-(--ops-border) py-2 text-sm first:border-t-0">
                    <span class="w-28 shrink-0">{{ formatDate(s.done_on) }}</span>
                    <span class="min-w-0 flex-1 truncate">{{ s.vendor ?? '—' }}{{ s.notes ? ` · ${s.notes}` : '' }}</span>
                    <span class="shrink-0 text-gray-500">{{ s.odometer_km.toLocaleString('en-MY') }} km · {{ s.cost_sen ? formatSen(s.cost_sen) : '—' }}</span>
                </div>
            </div>
        </template>
        <template #aside>
            <div v-if="vehicle" class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5 text-sm">
                <h4 class="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">Issues</h4>
                <p v-if="!vehicle.issues.length" class="text-gray-500">None reported.</p>
                <div v-for="i in vehicle.issues" :key="i.id" class="border-t border-(--ops-border) py-2 first:border-t-0">
                    <div class="flex justify-between text-xs text-gray-500"><span>{{ formatDateTime(i.reported_at) }}</span><span :class="i.status === 'open' && i.blocks_use ? 'font-medium text-error' : ''">{{ statusLabel(i.status) }}{{ i.status === 'open' && i.blocks_use ? ' · off the road' : '' }}</span></div>
                    <p>{{ i.description }}</p>
                </div>
            </div>
        </template>
    </OpsDetailPage>

    <OpsFormModal v-model:open="form.open" :title="form.data.id ? 'Renew Document' : 'Add Document'" :saving="form.saving" :error="form.error" submit-label="Save" @submit="saveDoc">
        <OpsFormField label="Document" required :error="fieldError('type')"><USelect v-model="form.data.type" :items="DOC_TYPES" :disabled="!!form.data.id" class="w-full" /></OpsFormField>
        <OpsFormField label="Number" :error="fieldError('number')"><UInput v-model="form.data.number" class="w-full" /></OpsFormField>
        <OpsFormField label="Issued" :error="fieldError('issued_on')"><UInput v-model="form.data.issued_on" type="date" class="w-full" /></OpsFormField>
        <OpsFormField label="Expires" :error="fieldError('expires_on')"><UInput v-model="form.data.expires_on" type="date" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
