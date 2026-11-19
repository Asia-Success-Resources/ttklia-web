<script setup lang="ts">
// Phone OTP sign-in with optional referral code (Sitemap 1, doc 31).
// POST /auth/otp/request then POST /auth/otp/verify (doc 04): WhatsApp first, SMS fallback.
// TODO(api): wire once packages/api-client-ts is generated.
const phone = ref('')
const code = ref('')
const referral = ref('')
</script>

<template>
  <PublicSection title="Sign in">
    <form class="flex max-w-sm flex-col gap-4" @submit.prevent>
      <UFormField label="Phone" name="phone"><UInput v-model="phone" type="tel" class="w-full" /></UFormField>
      <UFormField label="Code" name="code"><UInput v-model="code" inputmode="numeric" class="w-full" /></UFormField>
      <UFormField label="Referral code (optional)" name="referral"><UInput v-model="referral" class="w-full" /></UFormField>
      <UButton type="submit" label="Continue" disabled />
    </form>
  </PublicSection>
</template>
