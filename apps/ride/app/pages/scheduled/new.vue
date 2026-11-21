<script setup lang="ts">
// Book a scheduled ride for a rider by phone number (`channel = ops`; doc 35, Sitemap 4). Permission: ride.scheduled.write.
// POST /api/ops/w/{workspace}/rides (ttklia-api). TODO(api): stub; same checks and errors as POST /rides.
// TODO(api): pickup and drop-off through the places search (doc 05) and a fare quote before booking.
useHead({ title: 'Book a scheduled ride' })

const api = useApi()
const toast = useToast()
const { slug } = useWorkspace()

const form = reactive({ phone_e164: '', pickup: '', dropoff: '', vehicle_class: '', scheduled_for: '' })
const saving = ref(false)

/** Doc 35 error codes, in words staff can act on. */
const errors: Record<string, string> = {
    schedule_too_soon: 'The pickup is too soon. Pick a later time.',
    schedule_too_far: 'The pickup is too far ahead.',
    scheduled_ride_limit: 'This rider already has a scheduled ride.',
    pickup_zone_not_allowed: 'Pickups are not allowed there.',
    outstanding_balance: 'The rider owes money from an earlier ride and must pay first.',
}

async function submit() {
    if (!slug.value) return
    saving.value = true
    try {
        await api.post(api.workspacePath(slug.value, '/rides'), {
            ...form,
            scheduled_for: form.scheduled_for ? new Date(form.scheduled_for).toISOString() : null,
            channel: 'ops',
        })
        toast.add({ title: 'Scheduled ride booked', color: 'success' })
        await navigateTo('/scheduled')
    } catch (err) {
        const problem = toProblem(err)
        toast.add({ title: (problem?.code && errors[problem.code]) || problem?.detail || 'Could not book the ride', color: 'error' })
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <div>
        <OpsBreadcrumb title="Book a scheduled ride" />
        <UCard class="max-w-2xl">
            <form class="space-y-4" @submit.prevent="submit">
                <UFormField label="Rider's phone" name="phone_e164" required>
                    <UInput v-model="form.phone_e164" placeholder="+60…" class="w-full" />
                </UFormField>
                <UFormField label="Pickup" name="pickup" required>
                    <UInput v-model="form.pickup" class="w-full" />
                </UFormField>
                <UFormField label="Drop-off" name="dropoff" required>
                    <UInput v-model="form.dropoff" class="w-full" />
                </UFormField>
                <UFormField label="Car type" name="vehicle_class" required>
                    <UInput v-model="form.vehicle_class" class="w-full" />
                </UFormField>
                <UFormField label="Pickup time" name="scheduled_for" required>
                    <UInput v-model="form.scheduled_for" type="datetime-local" class="w-full" />
                </UFormField>
                <UButton type="submit" label="Book" :loading="saving" />
            </form>
        </UCard>
    </div>
</template>
