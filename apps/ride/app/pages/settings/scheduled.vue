<script setup lang="ts">
// Scheduled-ride and dispatch settings (table `ride_settings`; doc 35, Sitemap 4). Permission: ride.settings_scheduled.read.
// Saving writes a new row (a new `valid_from`), never an update. TODO(api): doc 04 has no settings endpoint yet.
// TODO(pending: H2) earliest pickup 10 or 30 minutes; TODO(pending: H5) more than one scheduled ride per rider.
useHead({ title: 'Scheduled ride settings' })

/** Doc 35 v2 defaults, shown until the API returns the row in force. */
const settings = reactive({
    scheduled_enabled: true,
    scheduled_min_lead_minutes: 30,
    scheduled_max_lead_days: 30,
    scheduled_max_active_per_rider: 1,
    scheduled_match_lead_minutes: 15,
    scheduled_no_driver_grace_minutes: 10,
    scheduled_reminder_minutes: 30,
    driver_review_seconds: 15,
    busy_stack_review_seconds: 20,
    ring_1_km: 3,
    ring_2_km: 6,
    driver_session_ttl_seconds: 180,
})

const fields: { key: Exclude<keyof typeof settings, 'scheduled_enabled'>; label: string; unit: string }[] = [
    { key: 'scheduled_min_lead_minutes', label: 'Earliest pickup', unit: 'minutes ahead' },
    { key: 'scheduled_max_lead_days', label: 'Latest pickup', unit: 'days ahead' },
    { key: 'scheduled_max_active_per_rider', label: 'Scheduled rides at once', unit: 'per rider' },
    { key: 'scheduled_match_lead_minutes', label: 'Start matching', unit: 'minutes before pickup' },
    { key: 'scheduled_no_driver_grace_minutes', label: 'No-driver grace', unit: 'minutes after pickup' },
    { key: 'scheduled_reminder_minutes', label: 'Reminder', unit: 'minutes before pickup' },
    { key: 'driver_review_seconds', label: 'Driver review window', unit: 'seconds' },
    { key: 'busy_stack_review_seconds', label: 'Busy-driver offer', unit: 'seconds' },
    { key: 'ring_1_km', label: 'Matching ring 1', unit: 'km' },
    { key: 'ring_2_km', label: 'Matching ring 2', unit: 'km' },
    { key: 'driver_session_ttl_seconds', label: 'Driver session timeout', unit: 'seconds' },
]
</script>

<template>
    <div>
        <OpsBreadcrumb title="Scheduled ride settings" />
        <UCard class="max-w-3xl">
            <UAlert
                class="mb-4"
                color="warning"
                variant="subtle"
                description="Showing the doc 35 defaults. Saving is not available until the API has a settings endpoint."
            />
            <OpsStatusToggle v-model="settings.scheduled_enabled" active-label="Riders can schedule rides" inactive-label="Scheduled rides are off" class="mb-4" />
            <div class="grid gap-4 sm:grid-cols-2">
                <UFormField v-for="field in fields" :key="field.key" :label="field.label" :hint="field.unit" :name="field.key">
                    <UInput v-model.number="settings[field.key]" type="number" min="0" class="w-full" />
                </UFormField>
            </div>
            <UButton class="mt-6" label="Save" disabled />
        </UCard>
    </div>
</template>
