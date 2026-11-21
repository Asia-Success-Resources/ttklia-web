<script setup lang="ts">
// Business on teeko.ai (doc 09): company accounts with monthly billing, booking agents with credit, and a Talk to us form.
// TODO(api): doc 04 has no endpoint for the enquiry form yet.
definePageMeta({ middleware: 'teeko-only' })
useHead({ title: 'Teeko for Business' })
const form = reactive({ company: '', name: '', contact: '', message: '' })
</script>

<template>
    <PublicSection title="Teeko for Business" lead="Company accounts and booking agents.">
        <div class="grid gap-4 md:grid-cols-2">
            <UCard><template #header>Company accounts</template><p class="text-sm text-muted">Your staff ride on the company account, billed monthly.</p></UCard>
            <UCard><template #header>Booking agents</template><p class="text-sm text-muted">Book rides for your customers from your credit.</p></UCard>
        </div>
        <UCard class="mt-6 max-w-xl">
            <template #header>Talk to us</template>
            <form class="space-y-4" @submit.prevent>
                <UFormField label="Company" name="company"><UInput v-model="form.company" class="w-full" /></UFormField>
                <UFormField label="Your name" name="name"><UInput v-model="form.name" class="w-full" /></UFormField>
                <UFormField label="Email or phone" name="contact"><UInput v-model="form.contact" class="w-full" /></UFormField>
                <UFormField label="Message" name="message"><UTextarea v-model="form.message" class="w-full" /></UFormField>
                <UButton type="submit" label="Send" disabled />
            </form>
        </UCard>
    </PublicSection>
</template>
