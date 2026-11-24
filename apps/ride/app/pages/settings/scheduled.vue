<script setup lang="ts">
// Scheduled-ride and dispatch settings (table `ride_settings`; doc 35, Sitemap 4). Saving writes a new row in force
// from now, never an update, so what applied at any time stays known; the last saves are listed.
// GET/POST /ops/w/{workspace}/ride/settings. Permission: ride.settings_scheduled.read / write.
// TODO(pending: H2) earliest pickup 10 or 30 minutes; TODO(pending: H5) more than one scheduled ride per rider.
useHead({ title: 'Scheduled ride settings' })

interface Settings {
    scheduled_enabled: boolean
    scheduled_min_lead_minutes: number
    scheduled_max_lead_days: number
    scheduled_max_active_per_rider: number
    scheduled_match_lead_minutes: number
    scheduled_no_driver_grace_minutes: number
    scheduled_reminder_minutes: number
    driver_review_seconds: number
    busy_stack_review_seconds: number
    ring_1_km: number
    ring_2_km: number
    driver_session_ttl_seconds: number
}
interface Saved { id: number; valid_from: string; scheduled_min_lead_minutes: number; scheduled_max_lead_days: number; scheduled_match_lead_minutes: number; scheduled_enabled: boolean }

const api = useRideApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('ride.settings_scheduled.write'))

const settings = reactive<Settings>({
    scheduled_enabled: true, scheduled_min_lead_minutes: 30, scheduled_max_lead_days: 30, scheduled_max_active_per_rider: 1,
    scheduled_match_lead_minutes: 15, scheduled_no_driver_grace_minutes: 10, scheduled_reminder_minutes: 30,
    driver_review_seconds: 15, busy_stack_review_seconds: 20, ring_1_km: 3, ring_2_km: 6, driver_session_ttl_seconds: 180,
})
const isDefault = ref(true)
const history = ref<Saved[]>([])
const loaded = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})

async function load() {
    try {
        const d = (await api.get<{ data: { settings: Settings; is_default: boolean; history: Saved[] } }>('/ride/settings')).data
        Object.assign(settings, d.settings)
        isDefault.value = d.is_default
        history.value = d.history
        loaded.value = true
    } catch (e) {
        toast.add({ title: rideError(e, 'Unable to load the settings'), color: 'error' })
    }
}
onMounted(load)

async function save() {
    saving.value = true
    errors.value = {}
    try {
        await api.post('/ride/settings', { ...settings })
        toast.add({ title: 'Settings saved; in force from now', color: 'success' })
        await load()
    } catch (e) {
        errors.value = (e as { data?: { errors?: Record<string, string[]> } })?.data?.errors ?? {}
        toast.add({ title: rideError(e), color: 'error' })
    } finally {
        saving.value = false
    }
}

const groups: { title: string; fields: { key: Exclude<keyof Settings, 'scheduled_enabled'>; label: string; unit: string; step?: string }[] }[] = [
    {
        title: 'Booking ahead',
        fields: [
            { key: 'scheduled_min_lead_minutes', label: 'Earliest pickup', unit: 'minutes ahead' },
            { key: 'scheduled_max_lead_days', label: 'Latest pickup', unit: 'days ahead' },
            { key: 'scheduled_max_active_per_rider', label: 'Scheduled rides at once', unit: 'per rider' },
            { key: 'scheduled_match_lead_minutes', label: 'Start matching', unit: 'minutes before pickup' },
            { key: 'scheduled_no_driver_grace_minutes', label: 'No-driver grace', unit: 'minutes after pickup' },
            { key: 'scheduled_reminder_minutes', label: 'Reminder', unit: 'minutes before pickup' },
        ],
    },
    {
        title: 'Dispatch',
        fields: [
            { key: 'driver_review_seconds', label: 'Driver review window', unit: 'seconds' },
            { key: 'busy_stack_review_seconds', label: 'Busy-driver offer', unit: 'seconds' },
            { key: 'ring_1_km', label: 'Matching ring 1', unit: 'km', step: '0.1' },
            { key: 'ring_2_km', label: 'Matching ring 2', unit: 'km', step: '0.1' },
            { key: 'driver_session_ttl_seconds', label: 'Driver session timeout', unit: 'seconds' },
        ],
    },
]
</script>

<template>
    <div>
        <OpsBreadcrumb title="Scheduled ride settings" />
        <div class="grid gap-6 xl:grid-cols-3">
            <UCard class="xl:col-span-2">
                <UAlert v-if="loaded && isDefault" class="mb-4" color="info" variant="subtle" description="These are the starting values from doc 35. Nothing has been saved yet." />
                <OpsStatusToggle v-model="settings.scheduled_enabled" active-label="Riders can schedule rides" inactive-label="Scheduled rides are off" class="mb-4" />
                <div v-for="g in groups" :key="g.title" class="mb-6">
                    <h4 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{{ g.title }}</h4>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <UFormField v-for="field in g.fields" :key="field.key" :label="field.label" :hint="field.unit" :name="field.key" :error="errors[field.key]?.[0]">
                            <UInput v-model.number="settings[field.key]" type="number" min="0" :step="field.step ?? '1'" class="w-full" :disabled="!canWrite" />
                        </UFormField>
                    </div>
                </div>
                <UButton v-if="canWrite" label="Save" :loading="saving" @click="save" />
            </UCard>

            <UCard>
                <template #header><span class="font-semibold">Saved before</span></template>
                <p v-if="!history.length" class="text-sm text-gray-500">No saves yet.</p>
                <ul v-else class="divide-y divide-(--ops-border) text-sm">
                    <li v-for="(h, i) in history" :key="h.id" class="py-2">
                        <div class="flex items-center justify-between">
                            <span class="font-medium">{{ formatDateTime(h.valid_from) }}</span>
                            <UBadge v-if="i === 0" label="In force" color="success" variant="soft" size="sm" />
                        </div>
                        <p class="text-xs text-gray-500">
                            {{ h.scheduled_enabled ? 'On' : 'Off' }} · {{ h.scheduled_min_lead_minutes }} min to {{ h.scheduled_max_lead_days }} days ahead · matching {{ h.scheduled_match_lead_minutes }} min before
                        </p>
                    </li>
                </ul>
            </UCard>
        </div>
    </div>
</template>
