<script setup lang="ts">
// Profile: email, password, 2FA (table `users`). Permission: global.profile.write (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
useHead({ title: 'Profile' })

const state = reactive<Record<string, string>>({
    uuid: '',
    name: '',
    email: '',
    phone_e164: '',
    locale: '',
    status: '',
    phone_verified_at: '',
    email_verified_at: ''
})
const saving = ref(false)

async function save() {
    // TODO(api): no write endpoint for this form in doc 04 yet.
}
</script>

<template>
    <OpsFormPage title="Profile" :saving="saving" @submit="save">
            <UFormField label="Uuid" name="uuid">
                <UInput v-model="state.uuid" class="w-full" />
            </UFormField>
            <UFormField label="Name" name="name">
                <UInput v-model="state.name" class="w-full" />
            </UFormField>
            <UFormField label="Email" name="email">
                <UInput v-model="state.email" class="w-full" />
            </UFormField>
            <UFormField label="Phone e164" name="phone_e164">
                <UInput v-model="state.phone_e164" class="w-full" />
            </UFormField>
            <UFormField label="Locale" name="locale">
                <UInput v-model="state.locale" class="w-full" />
            </UFormField>
            <UFormField label="Status" name="status">
                <UInput v-model="state.status" class="w-full" />
            </UFormField>
            <UFormField label="Phone verified at" name="phone_verified_at">
                <UInput v-model="state.phone_verified_at" class="w-full" />
            </UFormField>
            <UFormField label="Email verified at" name="email_verified_at">
                <UInput v-model="state.email_verified_at" class="w-full" />
            </UFormField>
    </OpsFormPage>
</template>
