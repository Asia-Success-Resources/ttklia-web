<script setup lang="ts">
// Airport rides on teeko.ai (doc 09): pickup points, flight-based scheduling, fares to and from the city.
// TODO(api): fares from fare_rules through the API; flight lookup for scheduling (doc 35).
definePageMeta({ middleware: 'teeko-only' })
useHead({ title: 'Airport rides' })
</script>

<template>
    <PublicSection title="Airport rides" lead="Pickups and drop-offs at KLIA and KLIA2.">
        <div class="grid gap-4 md:grid-cols-3">
            <UCard><template #header>Pickup points</template><p class="text-sm text-muted">KLIA2: Level 1, Door 5. KLIA: shown here once confirmed.</p></UCard>
            <UCard><template #header>Schedule by flight</template><p class="text-sm text-muted">Book ahead and we start finding your driver before you land.</p></UCard>
            <UCard><template #header>Fares</template><p class="text-sm text-muted">Fares to and from the city load from the API.</p></UCard>
        </div>
        <div class="mt-6 flex gap-3">
            <UButton :to="{ path: '/ride', query: { from: 'klia2' } }" label="Ride from KLIA2" />
            <UButton :to="{ path: '/ride', query: { to: 'klia2' } }" label="Ride to KLIA2" variant="outline" />
        </div>
    </PublicSection>
</template>
