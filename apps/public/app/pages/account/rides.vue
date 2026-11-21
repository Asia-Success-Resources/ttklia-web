<script setup lang="ts">
// My rides: scheduled (with Cancel) and past rides (Sitemap 1, doc 35). GET /rides?status=scheduled,
// POST /rides/{uuid}/cancel (doc 04); cancelling is free until a driver is assigned.
// TODO(api): wire once packages/api-client-ts is generated.
useHead({ title: 'My rides' })
</script>

<template>
    <PublicSection title="My rides">
        <div class="grid gap-4 md:grid-cols-2">
            <UCard><template #header>Scheduled</template><p class="text-sm text-muted">No scheduled rides</p></UCard>
            <UCard><template #header>Past rides</template><p class="text-sm text-muted">None yet</p></UCard>
        </div>
        <UButton class="mt-6" to="/ride" label="Book a ride" />
    </PublicSection>
</template>
