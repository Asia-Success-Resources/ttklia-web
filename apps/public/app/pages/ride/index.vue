<script setup lang="ts">
// E-hailing: book now or schedule (Sitemap 1, doc 35). POST /rides, with `scheduled_for` when scheduling (doc 04).
// TODO(api): pickup and drop-off through the places search (doc 05), car types and the quote (POST /quotes);
// allowed times come from `ride_settings` through the API. TODO(pending: H2) earliest pickup.
useHead({ title: 'Book a ride' })

// Prefilled from ?from, ?to and ?at (the teeko.ai home "See fares" and the airport links, doc 09).
const query = useRoute().query
const text = (value: unknown) => (typeof value === 'string' ? value : '')
const when = ref<'now' | 'schedule'>(text(query.at) ? 'schedule' : 'now')
const scheduledFor = ref(text(query.at))
const form = reactive({ pickup: text(query.from), dropoff: text(query.to) })
</script>

<template>
    <PublicSection title="Book a ride" lead="Ride now, or schedule a pickup up to 30 days ahead.">
        <UCard class="max-w-xl">
            <form class="space-y-4" @submit.prevent>
                <UFormField label="Pickup" name="pickup" required>
                    <UInput v-model="form.pickup" icon="i-bx-location-pin" class="w-full" />
                </UFormField>
                <UFormField label="Drop-off" name="dropoff" required>
                    <UInput v-model="form.dropoff" icon="i-bx-flag" class="w-full" />
                </UFormField>
                <div class="flex gap-2">
                    <UButton label="Now" :variant="when === 'now' ? 'solid' : 'outline'" @click="when = 'now'" />
                    <UButton label="Schedule" :variant="when === 'schedule' ? 'solid' : 'outline'" @click="when = 'schedule'" />
                </div>
                <UFormField v-if="when === 'schedule'" label="Pickup time" name="scheduled_for" required>
                    <UInput v-model="scheduledFor" type="datetime-local" class="w-full" />
                </UFormField>
                <p class="text-sm text-muted">Car types and the fare show here once the pickup and drop-off are set.</p>
                <UButton type="submit" label="Continue" disabled />
            </form>
        </UCard>
    </PublicSection>
</template>
