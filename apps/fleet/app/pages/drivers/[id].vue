<script setup lang="ts">
// One driver: details, documents (licence, PSV, medical… with expiry; add or renew one), the vehicles they drive most
// and their last jobs. GET /drivers/{id}, POST /documents, PATCH /documents/{id}. Permission: fleet.drivers.read / write.
interface Doc { id: number; type: string; number: string | null; issued_on: string | null; expires_on: string | null; status: string }
interface Driver extends Record<string, unknown> {
    id: number
    name: string
    phone_e164: string | null
    email: string | null
    driver_no: string | null
    tier: string
    licence_class: string
    languages: string[]
    status: string
    base_name: string | null
    organisation_name: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
    documents: Doc[]
    vehicles: { id: number; plate_no: string; vehicle_class: string; jobs: number }[]
    recent_jobs: { id: number; status: string; plate_no: string | null; booking_uuid: string | null; reference: string | null; pickup_at: string; job: string }[]
}

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.drivers.write'))
const driver = ref<Driver | null>(null)
const error = ref<string | null>(null)
useHead({ title: () => driver.value?.name ?? 'Driver' })

async function load() {
    try {
        driver.value = (await api.get<{ data: Driver }>(`/drivers/${id.value}`)).data
    } catch (e) {
        error.value = fleetError(e, 'Unable to load the driver.')
    }
}
onMounted(load)

const fields = computed(() => {
    const d = driver.value
    if (!d) return []
    return [
        { label: 'Name', value: d.name }, { label: 'Code', value: d.driver_no }, { label: 'Phone', value: d.phone_e164 }, { label: 'Email', value: d.email },
        { label: 'Tier', value: statusLabel(d.tier) }, { label: 'Licence class', value: d.licence_class || null }, { label: 'Languages', value: d.languages.join(', ') || null },
        { label: 'Base', value: d.base_name }, { label: 'Company', value: d.organisation_name }, { label: 'Status', value: statusLabel(d.status) },
        { label: 'Emergency contact', value: [d.emergency_contact_name, d.emergency_contact_phone].filter(Boolean).join(' · ') || null },
    ]
})

const DOC_TYPES = ['driving_licence', 'psv', 'medical', 'ic'].map((t) => ({ label: statusLabel(t), value: t }))
const { form, fieldError, show, submit } = useFormModal(() => ({ id: 0, type: 'driving_licence', number: '', issued_on: '', expires_on: '' }))
async function saveDoc() {
    const saved = await submit(async (d) => {
        const body = { number: d.number || null, issued_on: d.issued_on || null, expires_on: d.expires_on || null }
        if (d.id) await api.patch(`/documents/${d.id}`, body)
        else await api.post('/documents', { ...body, owner: 'driver', owner_id: driver.value!.id, type: d.type })
    })
    if (saved) {
        toast.add({ title: 'Document saved', color: 'success' })
        await load()
    }
}
const today = todayYmd()
</script>

<template>
    <OpsDetailPage :title="driver?.name ?? 'Driver'" :fields="fields">
        <template #actions>
            <UAlert v-if="error" class="w-full" color="error" variant="soft" :title="error" />
            <UButton label="Back" icon="i-bx-arrow-left-stroke" color="neutral" variant="ghost" to="/drivers" />
        </template>
        <template #body>
            <div v-if="driver" class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
                <div class="mb-3 flex items-center justify-between">
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">Documents</h4>
                    <UButton v-if="canWrite" label="Add document" icon="i-bx-plus" size="sm" @click="show()" />
                </div>
                <p v-if="!driver.documents.length" class="text-sm text-gray-500">No documents.</p>
                <table v-else class="w-full text-sm">
                    <thead class="text-left text-xs uppercase text-gray-500"><tr><th class="py-2">Document</th><th>Number</th><th>Expires</th><th>Status</th><th /></tr></thead>
                    <tbody>
                        <tr v-for="d in driver.documents" :key="d.id" class="border-t border-(--ops-border)">
                            <td class="py-2">{{ statusLabel(d.type) }}</td>
                            <td>{{ d.number ?? '—' }}</td>
                            <td :class="d.expires_on && d.expires_on < today ? 'font-medium text-error' : ''">{{ formatDate(d.expires_on) || '—' }}</td>
                            <td>{{ statusLabel(d.status) }}</td>
                            <td class="text-right"><UButton v-if="canWrite" label="Renew" size="xs" variant="ghost" @click="show({ id: d.id, type: d.type, number: d.number ?? '', issued_on: d.issued_on ?? '', expires_on: d.expires_on ?? '' })" /></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="driver" class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
                <h4 class="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">Last jobs</h4>
                <p v-if="!driver.recent_jobs.length" class="text-sm text-gray-500">No fleet jobs.</p>
                <div v-for="j in driver.recent_jobs" :key="j.id" class="flex items-center justify-between gap-3 border-t border-(--ops-border) py-2 text-sm first:border-t-0">
                    <span class="w-36 shrink-0">{{ formatDateTime(j.pickup_at) }}</span>
                    <NuxtLink v-if="j.booking_uuid" :to="`/limo/${j.booking_uuid}`" class="min-w-0 flex-1 truncate hover:underline">{{ j.reference }} · {{ j.job }}</NuxtLink>
                    <span v-else class="min-w-0 flex-1 truncate">Van · {{ j.job }}</span>
                    <span class="shrink-0 text-gray-500">{{ j.plate_no }} · {{ statusLabel(j.status) }}</span>
                </div>
            </div>
        </template>
        <template #aside>
            <div v-if="driver?.vehicles.length" class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5 text-sm">
                <h4 class="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">Vehicles driven</h4>
                <NuxtLink v-for="v in driver.vehicles" :key="v.id" :to="`/vehicles/${v.id}`" class="flex justify-between py-1 hover:underline">
                    <span>{{ v.plate_no }} <span class="text-gray-500">{{ v.vehicle_class }}</span></span><span>{{ v.jobs }} jobs</span>
                </NuxtLink>
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
