<script setup lang="ts">
// Settings: form (table `bus_terminal_settings`). Permission: bus.settings.write (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
useHead({ title: 'Settings' })

const state = reactive<Record<string, string>>({
    valid_from: '',
    alighting_minutes: '',
    platform_hold_before_departure_minutes: '',
    final_call_minutes: '',
    departed_after_minutes: '',
    departure_match_before_hours: '',
    departure_match_after_hours: '',
    arrival_match_before_hours: ''
})
const saving = ref(false)

async function save() {
    // TODO(api): no write endpoint for this form in doc 04 yet.
}

// Display: how this workspace's screens show times (`workspaces.time_format`).
// GET / PATCH /api/ops/w/{workspace}/settings/display. Permission: bus.settings.read / write.
const api = useApi()
const toast = useToast()
const { can, load: loadMe } = useMe()
const { slug } = useWorkspace()
const canWrite = computed(() => can('bus.settings.write'))
const timeFormat = ref<'12h' | '24h'>('12h')
const savedFormat = ref<'12h' | '24h'>('12h')
const displaySaving = ref(false)
const displayError = ref<string | null>(null)
const TIME_FORMATS = [
    { value: '12h' as const, label: '12-hour', example: '2:05 PM' },
    { value: '24h' as const, label: '24-hour', example: '14:05' },
]

onMounted(async () => {
    if (!slug.value) return
    try {
        const res = await api.get<{ data: { time_format: '12h' | '24h' } }>(`/ops/w/${slug.value}/settings/display`)
        timeFormat.value = savedFormat.value = res.data.time_format
    } catch (e) {
        displayError.value = toProblem(e)?.detail ?? 'Unable to load the display settings.'
    }
})

// Terminal charges: the collection fee (with the facility charge inside it), a new version from now on each save.
// GET / PATCH /api/ops/w/{workspace}/settings/terminal-charges. Permission: bus.settings.read / write.
interface ChargesHistory { valid_from: string; valid_from_local: string; collection_fee_rm: number; facility_fee_rm: number }
interface Charges {
    collection_fee_rm: number
    facility_fee_rm: number
    boarding_pass_fee_rm: number
    boarding_pass_sst_rm: number
    sst_rate_percent: number
    history: ChargesHistory[]
}
const charges = ref<Charges | null>(null)
const collectionFee = ref('')
const chargesSaving = ref(false)
const chargesError = ref<string | null>(null)
const rm = (v: number) => `RM ${v.toFixed(2)}`
const chargesChanged = computed(() => !!charges.value && collectionFee.value !== charges.value.collection_fee_rm.toFixed(2))

function showCharges(c: Charges) {
    charges.value = c
    collectionFee.value = c.collection_fee_rm.toFixed(2)
}

onMounted(async () => {
    if (!slug.value) return
    try {
        const res = await api.get<{ data: Charges }>(`/ops/w/${slug.value}/settings/terminal-charges`)
        showCharges(res.data)
    } catch (e) {
        chargesError.value = toProblem(e)?.detail ?? 'Unable to load the terminal charges.'
    }
})

async function saveCharges() {
    if (!slug.value) return
    chargesSaving.value = true
    chargesError.value = null
    try {
        const res = await api.patch<{ data: Charges }>(`/ops/w/${slug.value}/settings/terminal-charges`, { collection_fee_rm: collectionFee.value })
        showCharges(res.data)
        toast.add({ title: 'Collection fee saved', description: 'New collections at the counter and the kiosks use it from now.', color: 'success' })
    } catch (e) {
        const p = toProblem(e)
        chargesError.value = p?.errors?.collection_fee_rm?.[0] ?? p?.detail ?? 'Unable to save the collection fee.'
    } finally {
        chargesSaving.value = false
    }
}

async function saveDisplay() {
    if (!slug.value) return
    displaySaving.value = true
    displayError.value = null
    try {
        const res = await api.patch<{ data: { time_format: '12h' | '24h' } }>(`/ops/w/${slug.value}/settings/display`, { time_format: timeFormat.value })
        savedFormat.value = res.data.time_format
        await loadMe(slug.value) // every screen reads the format from /me
        toast.add({ title: 'Time format saved', color: 'success' })
    } catch (e) {
        displayError.value = toProblem(e)?.detail ?? 'Unable to save the time format.'
    } finally {
        displaySaving.value = false
    }
}
</script>

<template>
    <div>
    <OpsFormPage title="Settings" :saving="saving" @submit="save">
            <UFormField label="Valid from" name="valid_from">
                <UInput v-model="state.valid_from" class="w-full" />
            </UFormField>
            <UFormField label="Alighting minutes" name="alighting_minutes">
                <UInput v-model="state.alighting_minutes" class="w-full" />
            </UFormField>
            <UFormField label="Platform hold before departure minutes" name="platform_hold_before_departure_minutes">
                <UInput v-model="state.platform_hold_before_departure_minutes" class="w-full" />
            </UFormField>
            <UFormField label="Final call minutes" name="final_call_minutes">
                <UInput v-model="state.final_call_minutes" class="w-full" />
            </UFormField>
            <UFormField label="Departed after minutes" name="departed_after_minutes">
                <UInput v-model="state.departed_after_minutes" class="w-full" />
            </UFormField>
            <UFormField label="Departure match before hours" name="departure_match_before_hours">
                <UInput v-model="state.departure_match_before_hours" class="w-full" />
            </UFormField>
            <UFormField label="Departure match after hours" name="departure_match_after_hours">
                <UInput v-model="state.departure_match_after_hours" class="w-full" />
            </UFormField>
            <UFormField label="Arrival match before hours" name="arrival_match_before_hours">
                <UInput v-model="state.arrival_match_before_hours" class="w-full" />
            </UFormField>
    </OpsFormPage>

    <div class="mt-6 rounded-lg border border-(--ops-border) bg-(--ops-card) p-5">
        <h3 class="mb-1 text-lg font-semibold text-gray-800 dark:text-white">Terminal charges</h3>
        <p class="mb-4 text-sm text-gray-500">
            What a passenger pays to collect a boarding pass for a ticket bought elsewhere (operator website, Redbus,
            BusOnlineTicket, Easybook), per seat, at the counter and the kiosks. A change applies to new collections from
            the moment it is saved.
        </p>
        <UFormField label="Collection fee (RM, per seat)" name="collection_fee_rm" required>
            <UInput v-model="collectionFee" type="number" min="0" step="0.01" :disabled="!canWrite || !charges" class="w-48" />
        </UFormField>
        <div v-if="charges" class="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Made up of the facility charge {{ rm(charges.facility_fee_rm) }} and the boarding pass fee
            {{ rm(charges.boarding_pass_fee_rm) }} + SST {{ rm(charges.boarding_pass_sst_rm) }} ({{ charges.sst_rate_percent }}%).
        </div>
        <div v-if="charges?.history.length" class="mt-4">
            <div class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Changes</div>
            <ul class="text-sm text-gray-500">
                <li v-for="h in charges.history" :key="h.valid_from">
                    From {{ h.valid_from_local }}: collection {{ rm(h.collection_fee_rm) }} (facility {{ rm(h.facility_fee_rm) }})
                </li>
            </ul>
        </div>
        <p v-if="chargesError" class="mt-3 text-sm text-error">{{ chargesError }}</p>
        <div v-if="canWrite" class="mt-4 flex justify-end">
            <UButton label="Save" :loading="chargesSaving" :disabled="!chargesChanged" @click="saveCharges" />
        </div>
    </div>

    <div class="mt-6 rounded-lg border border-(--ops-border) bg-(--ops-card) p-5">
        <h3 class="mb-1 text-lg font-semibold text-gray-800 dark:text-white">Display</h3>
        <p class="mb-4 text-sm text-gray-500">How times show on this location's screens, such as the sale dashboard.</p>
        <UFormField label="Time format" required>
            <div class="flex flex-wrap gap-3">
                <button
                    v-for="f in TIME_FORMATS"
                    :key="f.value"
                    type="button"
                    :disabled="!canWrite"
                    class="rounded-xl border-2 px-5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60"
                    :class="timeFormat === f.value ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/50 dark:border-gray-700'"
                    @click="timeFormat = f.value"
                >
                    <div class="font-semibold text-gray-800 dark:text-white">{{ f.label }}</div>
                    <div class="text-sm text-gray-500">e.g. {{ f.example }}</div>
                </button>
            </div>
        </UFormField>
        <p v-if="displayError" class="mt-3 text-sm text-error">{{ displayError }}</p>
        <div v-if="canWrite" class="mt-4 flex justify-end">
            <UButton label="Save" :loading="displaySaving" :disabled="timeFormat === savedFormat" @click="saveDisplay" />
        </div>
    </div>
    </div>
</template>
