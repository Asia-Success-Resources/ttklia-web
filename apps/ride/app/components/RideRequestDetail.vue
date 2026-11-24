<script setup lang="ts">
import type { RideRequestDetail } from '~/utils/ride'

// One ride request (doc 07, doc 35): who asked, from where to where, the car, fare and payment, the booking ahead
// (pickup, when matching starts, reminder), the offers sent to drivers, and the ride once a driver took it. Cancel
// with a reason while no driver has it. Used by /requests/{uuid} and /scheduled/{uuid}.
// GET /ride/requests/{uuid}; POST /ride/requests/{uuid}/cancel (or /rides/{uuid}/cancel for a scheduled ride).
const props = defineProps<{ uuid: string; title: string; back: string }>()

const api = useRideApi()
const toast = useToast()
const { can } = useMe()
const canCancel = computed(() => can('ride.requests.write') || can('ride.scheduled.write'))

const data = ref<RideRequestDetail | null>(null)
const error = ref<string | null>(null)
async function load() {
    try {
        data.value = (await api.get<{ data: RideRequestDetail }>(`/ride/requests/${props.uuid}`)).data
        error.value = null
    } catch (e) {
        error.value = rideError(e, 'Unable to load the ride.')
    }
}
onMounted(load)

const reasonAction = useReasonAction()
function cancel() {
    const d = data.value
    if (!d) return
    reasonAction.ask({
        title: 'Cancel this ride',
        submitLabel: 'Cancel ride',
        run: async (reason) => {
            await api.post(d.scheduled_for ? `/rides/${d.uuid}/cancel` : `/ride/requests/${d.uuid}/cancel`, { reason })
            toast.add({ title: 'Ride cancelled', color: 'success' })
            await load()
        },
    })
}

const fields = computed(() => {
    const d = data.value
    if (!d) return []
    return [
        { label: 'Status', value: statusLabel(d.status) },
        { label: 'Rider', value: [d.rider_name, d.rider_phone].filter(Boolean).join(' · ') || null },
        { label: 'Pickup', value: d.pickup },
        { label: 'Drop-off', value: d.dropoff },
        { label: 'Car', value: carLabel(d.vehicle_class) },
        { label: 'Quoted fare', value: formatSen(d.quoted_fare_sen) },
        { label: 'Payment', value: statusLabel(d.payment_method) },
        { label: 'Booked by', value: statusLabel(d.channel) },
        { label: 'Requested', value: formatDateTime(d.created_at) },
        ...(d.scheduled_for
            ? [
                  { label: 'Scheduled pickup', value: formatDateTime(d.scheduled_for) },
                  { label: 'Matching from', value: d.matching_starts_at ? formatDateTime(d.matching_starts_at) : null },
                  { label: 'Reminder sent', value: d.reminder_sent_at ? formatDateTime(d.reminder_sent_at) : 'Not yet' },
              ]
            : []),
        ...(d.status === 'cancelled' ? [{ label: 'Cancelled by', value: statusLabel(d.cancelled_by ?? '-') }, { label: 'Reason', value: d.cancel_reason }] : []),
    ]
})

const steps = computed(() => {
    const r = data.value?.ride
    if (!r) return []
    return [
        { label: 'Driver accepted', at: r.accepted_at },
        { label: 'Arrived at pickup', at: r.arrived_at },
        { label: 'Picked up', at: r.picked_up_at },
        { label: 'Completed', at: r.completed_at },
    ]
})
</script>

<template>
    <div>
        <UAlert v-if="error" class="mb-4" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />
        <OpsDetailPage v-if="data" :title="props.title" :fields="fields">
            <template #actions>
                <UButton :to="props.back" label="Back" icon="i-bx-arrow-left-stroke" color="neutral" variant="outline" />
                <UButton v-if="canCancel && CANCELLABLE.includes(data.status)" label="Cancel ride" icon="i-bx-x-circle" color="error" variant="soft" @click="cancel" />
            </template>

            <template #body>
                <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
                    <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Offers to drivers</h4>
                    <p v-if="!data.offers.length" class="text-sm text-gray-500">No offers were sent.</p>
                    <div v-else class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="text-left text-xs uppercase text-gray-500">
                                <tr><th class="py-2 pr-4">Driver</th><th class="py-2 pr-4">Round</th><th class="py-2 pr-4">Ring</th><th class="py-2 pr-4">ETA</th><th class="py-2 pr-4">Sent</th><th class="py-2 pr-4">Response</th></tr>
                            </thead>
                            <tbody>
                                <tr v-for="o in data.offers" :key="o.id" class="border-t border-(--ops-border)">
                                    <td class="py-2 pr-4">{{ o.driver_name ?? o.driver_no ?? `#${o.driver_id}` }}</td>
                                    <td class="py-2 pr-4">{{ o.round }}</td>
                                    <td class="py-2 pr-4">{{ o.ring_k }}</td>
                                    <td class="py-2 pr-4">{{ minutes(o.eta_seconds) }}</td>
                                    <td class="py-2 pr-4">{{ formatDateTime(o.offered_at) }}</td>
                                    <td class="py-2 pr-4"><OpsStatusCell :status="o.response" /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </template>

            <template #aside>
                <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
                    <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Ride</h4>
                    <p v-if="!data.ride" class="text-sm text-gray-500">No driver has taken this request.</p>
                    <template v-else>
                        <dl class="mb-4 grid grid-cols-2 gap-3 text-sm">
                            <div><dt class="text-xs text-gray-500">Driver</dt><dd class="font-medium">{{ data.driver_name ?? '—' }}</dd></div>
                            <div><dt class="text-xs text-gray-500">Vehicle</dt><dd class="font-medium">{{ data.vehicle_plate ?? '—' }}</dd></div>
                            <div><dt class="text-xs text-gray-500">Status</dt><dd class="font-medium">{{ statusLabel(data.ride.status) }}</dd></div>
                            <div><dt class="text-xs text-gray-500">Final fare</dt><dd class="font-medium">{{ data.ride.final_fare_sen ? formatSen(data.ride.final_fare_sen) : '—' }}</dd></div>
                            <div><dt class="text-xs text-gray-500">Distance</dt><dd class="font-medium">{{ km(data.ride.distance_m) }}</dd></div>
                            <div><dt class="text-xs text-gray-500">Duration</dt><dd class="font-medium">{{ minutes(data.ride.duration_s) }}</dd></div>
                        </dl>
                        <ol class="space-y-2 border-t border-(--ops-border) pt-4 text-sm">
                            <li v-for="s in steps" :key="s.label" class="flex items-center justify-between gap-3">
                                <span class="flex items-center gap-2" :class="s.at ? '' : 'text-gray-400'">
                                    <UIcon :name="s.at ? 'i-bx-check-circle' : 'i-bx-circle'" class="size-4" :class="s.at ? 'text-success' : ''" />
                                    {{ s.label }}
                                </span>
                                <span class="text-xs text-gray-500">{{ s.at ? formatDateTime(s.at) : '—' }}</span>
                            </li>
                        </ol>
                        <p v-if="data.ride.cancel_reason" class="mt-3 text-sm text-error">Cancelled: {{ data.ride.cancel_reason }}</p>
                    </template>
                </div>
            </template>
        </OpsDetailPage>
        <OpsReasonModal :action="reasonAction" />
    </div>
</template>
