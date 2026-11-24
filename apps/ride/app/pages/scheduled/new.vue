<script setup lang="ts">
// Book a scheduled ride for a rider by phone number (`channel = ops`; doc 35, Sitemap 4). Pickup and drop-off are
// places (POIs); the fare quoted to the rider is entered here. POST /ops/w/{workspace}/rides, with the same rules as
// the app (earliest and latest pickup, rides at once: GET /ride/settings). Permission: ride.scheduled.write.
// TODO(api): a fare quote (doc 06) and free addresses through the places search (doc 05).
useHead({ title: 'Book a scheduled ride' })

const api = useRideApi()
const toast = useToast()

interface Place { id: number; name: string; category: string }
const places = useApiAll<Place>({ path: '/places', workspaceScoped: true, max: 2000 })
const settings = ref<{ scheduled_min_lead_minutes: number; scheduled_max_lead_days: number; scheduled_match_lead_minutes: number } | null>(null)
onMounted(async () => {
    places.load()
    try {
        settings.value = (await api.get<{ data: { settings: typeof settings.value } }>('/ride/settings')).data.settings
    } catch {
        settings.value = null
    }
})
const placeItems = computed(() => places.rows.value.map((p) => ({ label: p.name, value: p.id, description: statusLabel(p.category) })))

const CARS = RIDE_CLASSES.map((c) => ({ label: c.name, value: c.value as string, description: `${c.seats} seats` }))
const form = reactive({
    phone_e164: '',
    pickup_poi_id: undefined as number | undefined,
    dropoff_poi_id: undefined as number | undefined,
    vehicle_class: 'economy' as string,
    scheduled_for: '',
    fare: '',
    payment_method: 'cash',
})
const errors = ref<Record<string, string[]>>({})
const saving = ref(false)

/** Doc 35 error codes, in words staff can act on. */
const MESSAGES: Record<string, string> = {
    schedule_too_soon: 'The pickup is too soon. Pick a later time.',
    schedule_too_far: 'The pickup is too far ahead.',
    scheduled_ride_limit: 'This rider already has a scheduled ride.',
    scheduling_off: 'Booking ahead is switched off in the settings.',
    rider_not_found: 'No rider has this phone number.',
    no_fare_rule: 'No ride fare rule is set up yet.',
}

async function submit() {
    saving.value = true
    errors.value = {}
    try {
        const res = await api.post<{ data: { uuid: string } }>('/rides', {
            phone_e164: form.phone_e164.replace(/[\s-]/g, ''),
            pickup_poi_id: form.pickup_poi_id,
            dropoff_poi_id: form.dropoff_poi_id,
            vehicle_class: form.vehicle_class,
            // The picker gives Malaysia time; the API takes RFC 3339.
            scheduled_for: form.scheduled_for ? `${form.scheduled_for}:00+08:00` : null,
            quoted_fare_sen: form.fare === '' ? null : Math.round(Number(form.fare) * 100),
            payment_method: form.payment_method,
        })
        toast.add({ title: 'Scheduled ride booked', color: 'success' })
        await navigateTo(`/scheduled/${res.data.uuid}`)
    } catch (e) {
        const data = (e as { data?: { errors?: Record<string, string[]>; code?: string } })?.data
        errors.value = data?.errors ?? {}
        const problem = toProblem(e)
        toast.add({ title: (problem?.code && MESSAGES[problem.code]) || rideError(e, 'Could not book the ride'), color: 'error' })
    } finally {
        saving.value = false
    }
}
const err = (k: string) => errors.value[k]?.[0]
</script>

<template>
    <div>
        <OpsBreadcrumb title="Book a scheduled ride" />
        <UCard class="max-w-3xl">
            <p v-if="settings" class="mb-4 text-sm text-gray-500">
                The pickup must be {{ settings.scheduled_min_lead_minutes }} minutes to {{ settings.scheduled_max_lead_days }} days ahead.
                Matching starts {{ settings.scheduled_match_lead_minutes }} minutes before the pickup.
            </p>
            <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="submit">
                <UFormField label="Rider's phone" required :error="err('phone_e164')" class="sm:col-span-2" hint="With the country code">
                    <UInput v-model="form.phone_e164" placeholder="+60123456789" class="w-full" />
                </UFormField>
                <UFormField label="Pickup" required :error="err('pickup_poi_id')">
                    <USelectMenu v-model="form.pickup_poi_id" :items="placeItems" value-key="value" placeholder="Choose a place" class="w-full" />
                </UFormField>
                <UFormField label="Drop-off" required :error="err('dropoff_poi_id')">
                    <USelectMenu v-model="form.dropoff_poi_id" :items="placeItems" value-key="value" placeholder="Choose a place" class="w-full" />
                </UFormField>
                <UFormField label="Pickup time" required :error="err('scheduled_for')" hint="Malaysia time">
                    <UInput v-model="form.scheduled_for" type="datetime-local" class="w-full" />
                </UFormField>
                <UFormField label="Car" required :error="err('vehicle_class')">
                    <USelect v-model="form.vehicle_class" :items="CARS" class="w-full" />
                </UFormField>
                <UFormField label="Fare quoted (RM)" required :error="err('quoted_fare_sen')">
                    <UInput v-model="form.fare" type="number" min="0" step="0.01" class="w-full" />
                </UFormField>
                <UFormField label="Payment" :error="err('payment_method')">
                    <USelect v-model="form.payment_method" :items="[{ label: 'Cash', value: 'cash' }, { label: 'Card', value: 'card' }, { label: 'Wallet', value: 'wallet' }]" class="w-full" />
                </UFormField>
                <div class="flex gap-2 sm:col-span-2">
                    <UButton type="submit" label="Book ride" :loading="saving" />
                    <UButton to="/scheduled" label="Cancel" color="neutral" variant="outline" />
                </div>
            </form>
        </UCard>
    </div>
</template>
