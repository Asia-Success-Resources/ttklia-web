<script setup lang="ts">
// Explore Malaysia on teeko.ai (doc 09): the tourism pages kept from today.
// TODO(pending: W2) keep them here or move them to ttklia.com. TODO(doc 09): every current URL keeps working or 301s
// to its /explore page; the redirects belong in ttklia-deploy (Nginx) once the old URLs are listed.
definePageMeta({ middleware: 'teeko-only' })
useHead({ title: 'Explore Malaysia' })
</script>

<template>
    <PublicSection title="Explore Malaysia">
        <div class="grid gap-4 md:grid-cols-3">
            <UCard><template #header>Places</template><UButton to="/explore/places" label="Restaurants" variant="link" /></UCard>
            <UCard><template #header>Travel SIM</template><UButton to="/explore/travel-sim" label="SIM packages" variant="link" /></UCard>
            <UCard><template #header>Blog</template><UButton to="/explore/blog" label="Guides" variant="link" /></UCard>
        </div>
    </PublicSection>
</template>
