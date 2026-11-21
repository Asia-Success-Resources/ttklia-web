<script setup lang="ts">
// Profile, orders, wallet, vouchers (Sitemap 1). GET /me, GET /wallet (doc 04).
// TODO(api): GET /me/vouchers is (planned) in doc 31, not yet in doc 04.
useHead({ title: 'My account' })
</script>

<template>
    <PublicSection title="My account">
        <div class="grid gap-4 md:grid-cols-3">
            <UCard><template #header>Orders</template><p class="text-sm text-muted">None yet</p></UCard>
            <UCard><template #header>Wallet</template><p class="text-sm text-muted">{{ formatSen(null) }}</p></UCard>
            <UCard><template #header>Vouchers</template><p class="text-sm text-muted">None yet</p></UCard>
        </div>
        <div class="mt-6 flex gap-2">
            <UButton to="/account/rides" label="My rides" variant="outline" />
            <UButton to="/account/invite" label="Invite friends" variant="outline" />
        </div>
    </PublicSection>
</template>
