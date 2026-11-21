<script setup lang="ts">
// Driver sign-up on teeko.ai (doc 09): requirements, earnings, FAQ; Apply opens the driver sign-up, then the driver app.
// TODO(pending: W4) requirements and earnings wording; TODO(api): driver application endpoint (doc 04, Flow 1).
definePageMeta({ middleware: 'teeko-only' })
useHead({ title: 'Drive with Teeko' })
</script>

<template>
    <PublicSection title="Drive with Teeko" lead="Earn on your own schedule.">
        <div class="grid gap-4 md:grid-cols-2">
            <UCard><template #header>What you need</template><p class="text-sm text-muted">A driving licence, a PSV and e-hailing permit, and a car within the age limit.</p></UCard>
            <UCard><template #header>What you earn</template><p class="text-sm text-muted">Earnings details will be shown here.</p></UCard>
        </div>
        <UButton class="mt-6" label="Apply" disabled />
    </PublicSection>
</template>
