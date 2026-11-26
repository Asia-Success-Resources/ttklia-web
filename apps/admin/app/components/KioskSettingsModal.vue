<script setup lang="ts">
// What a kiosk shows (doc 25 "Running the kiosks"): its services, languages, header text, receipt options and idle
// time, stored in `devices.config` and sent to the kiosk at every heartbeat, so a change shows within a minute.
// Opened from Global → Settings → Kiosks (and Devices) for a kiosk app.
// GET /api/admin/devices/{uuid} (its `config`), PATCH /admin/devices/{uuid} { config }.
// Keys this form doesn't edit (taxi_workspace, teeko_offer_code, …) are kept as they are.

/** The API's defaults when a key is missing (ttklia-api DeviceController::KIOSK_DEFAULTS). */
const DEFAULTS = {
    services: ['bus', 'taxi'] as string[],
    languages: ['en', 'ms', 'zh', 'ja', 'ko', 'fr', 'pt', 'es'] as string[],
    idle_seconds: 60,
    receipt: { print: true, email: true, whatsapp: true },
}

const SERVICES = [
    { value: 'bus', label: 'Bus tickets', description: 'Buy a bus ticket to a destination' },
    { value: 'taxi', label: 'Taxi coupons', description: 'Buy a taxi coupon (needs an active taxi workspace)' },
    { value: 'exchange', label: 'Exchange ticket', description: 'Swap a ticket bought elsewhere for a boarding pass' },
    { value: 'tour', label: 'Tour packages', description: 'Browse and buy tour packages (not built yet: shows an empty page)' },
]
const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'ms', label: 'Bahasa Melayu' },
    { value: 'zh', label: '中文 (Chinese)' },
    { value: 'ja', label: '日本語 (Japanese)' },
    { value: 'ko', label: '한국어 (Korean)' },
    { value: 'fr', label: 'Français' },
    { value: 'pt', label: 'Português' },
    { value: 'es', label: 'Español' },
]
const RECEIPTS = [
    { value: 'print', label: 'Print' },
    { value: 'email', label: 'E-mail' },
    { value: 'whatsapp', label: 'WhatsApp' },
] as const

const props = defineProps<{ device: { uuid: string; name: string } | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ saved: [] }>()

const api = useApi()
const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const stored = ref<Record<string, unknown>>({})
const form = reactive({
    services: [] as string[],
    languages: [] as string[],
    site_name: '',
    idle_seconds: 60,
    receipt: { print: true, email: true, whatsapp: true } as Record<'print' | 'email' | 'whatsapp', boolean>,
})

watch(open, async (isOpen) => {
    if (!isOpen || !props.device) return
    loading.value = true
    error.value = null
    try {
        const res = await api.get<{ data: { config: Record<string, unknown> | null } }>(`/admin/devices/${props.device.uuid}`)
        const cfg = res.data.config ?? {}
        stored.value = cfg
        form.services = [...((cfg.services as string[] | undefined) ?? DEFAULTS.services)]
        form.languages = [...((cfg.languages as string[] | undefined) ?? DEFAULTS.languages)]
        form.site_name = (cfg.site_name as string | undefined) ?? ''
        form.idle_seconds = Number(cfg.idle_seconds ?? DEFAULTS.idle_seconds)
        form.receipt = { ...DEFAULTS.receipt, ...((cfg.receipt as typeof DEFAULTS.receipt | undefined) ?? {}) }
    } catch (e) {
        error.value = toProblem(e)?.detail ?? 'Unable to load the kiosk settings.'
    } finally {
        loading.value = false
    }
})

function toggle(list: string[], value: string, on: boolean) {
    const i = list.indexOf(value)
    if (on && i < 0) list.push(value)
    if (!on && i >= 0) list.splice(i, 1)
}

async function save() {
    if (!props.device) return
    error.value = null
    if (!form.services.length) return void (error.value = 'Turn on at least one service.')
    if (!form.languages.length) return void (error.value = 'Turn on at least one language.')
    if (!(form.idle_seconds >= 15 && form.idle_seconds <= 600)) return void (error.value = 'Idle time must be between 15 and 600 seconds.')
    saving.value = true
    try {
        const config: Record<string, unknown> = {
            ...stored.value,
            // in the order the kiosk lists them
            services: SERVICES.map((s) => s.value).filter((v) => form.services.includes(v)),
            languages: LANGUAGES.map((l) => l.value).filter((v) => form.languages.includes(v)),
            idle_seconds: Math.round(form.idle_seconds),
            receipt: { ...form.receipt },
        }
        const site = form.site_name.trim()
        if (site) config.site_name = site
        else delete config.site_name
        await api.patch(`/admin/devices/${props.device.uuid}`, { config })
        toast.add({ title: `${props.device.name} updated`, description: 'The kiosk picks it up at its next heartbeat.', color: 'success' })
        open.value = false
        emit('saved')
    } catch (e) {
        error.value = toProblem(e)?.detail ?? 'Unable to save the kiosk settings.'
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <OpsFormModal v-model:open="open" :title="`Kiosk Settings · ${props.device?.name ?? ''}`" :saving="saving" :error="error" submit-label="Save" @submit="save">
        <div v-if="loading" class="flex justify-center py-8 sm:col-span-2">
            <UIcon name="i-bx-loader-lines" class="size-6 animate-spin text-gray-400" />
        </div>
        <template v-else>
            <OpsFormField label="Services shown" required full>
                <div class="space-y-3">
                    <div v-for="s in SERVICES" :key="s.value" class="flex items-center justify-between gap-4 rounded-lg border border-(--ops-border) px-4 py-3">
                        <div>
                            <div class="font-medium text-gray-800 dark:text-white">{{ s.label }}</div>
                            <div class="text-xs text-gray-500">{{ s.description }}</div>
                        </div>
                        <USwitch :model-value="form.services.includes(s.value)" @update:model-value="(on: boolean) => toggle(form.services, s.value, on)" />
                    </div>
                </div>
            </OpsFormField>

            <OpsFormField label="Languages offered" required full>
                <div class="grid grid-cols-2 gap-2">
                    <UCheckbox
                        v-for="l in LANGUAGES"
                        :key="l.value"
                        :label="l.label"
                        :model-value="form.languages.includes(l.value)"
                        @update:model-value="(on: boolean | 'indeterminate') => toggle(form.languages, l.value, on === true)"
                    />
                </div>
            </OpsFormField>

            <OpsFormField label="Header (where the kiosk is)" full>
                <UTextarea
                    v-model="form.site_name"
                    :rows="2"
                    :maxrows="2"
                    autoresize
                    placeholder="Lalaport Transportation Hub&#10;Bukit Bintang City Centre"
                    class="w-full"
                />
                <p class="mt-1 text-xs text-gray-500">Top right of the start screen, two lines at most. Empty: the kiosk's location name.</p>
            </OpsFormField>

            <OpsFormField label="Receipt options">
                <div class="flex flex-wrap gap-4 pt-1">
                    <UCheckbox v-for="r in RECEIPTS" :key="r.value" v-model="form.receipt[r.value]" :label="r.label" />
                </div>
            </OpsFormField>

            <OpsFormField label="Back to start after (seconds)" required>
                <UInput v-model.number="form.idle_seconds" type="number" min="15" max="600" class="w-full" />
            </OpsFormField>
        </template>
    </OpsFormModal>
</template>
