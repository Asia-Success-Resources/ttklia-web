<script setup lang="ts">
// Profile, orders, wallet, vouchers (Sitemap 1). GET /me, GET /wallet (doc 04).
// TODO(api): GET /me/vouchers is (planned) in doc 31, not yet in doc 04.
</script>

<template>
  <PublicSection title="My account">
    <div class="grid gap-4 md:grid-cols-3">
      <UCard><template #header>Orders</template><p class="text-sm text-muted">None yet</p></UCard>
      <UCard><template #header>Wallet</template><p class="text-sm text-muted">{{ formatSen(null) }}</p></UCard>
      <UCard><template #header>Vouchers</template><p class="text-sm text-muted">None yet</p></UCard>
    </div>
    <UButton class="mt-6" to="/account/invite" label="Invite friends" variant="outline" />
  </PublicSection>
</template>
