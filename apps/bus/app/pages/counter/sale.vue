<script setup lang="ts">
// Counter: sale: basket of tickets, protection, voucher, coupons, tours (Sitemap). Permission: bus.bookings.write (doc 27).
// Prices come from POST /quotes; the order from POST /orders; payment from POST /orders/{uuid}/pay (doc 04).
// TODO(api): item pickers call GET /bus/trips, GET /bus/trips/{uuid}/seats and POST /quotes once the client is generated.
useHead({ title: 'Counter sale' })
definePageMeta({ layout: 'counter' })
</script>

<template>
    <div class="grid gap-4 lg:grid-cols-3">
        <div class="rounded-2xl border border-(--app-border) bg-(--app-card) p-4 lg:col-span-2">
            <h2 class="mb-3 text-lg font-semibold">Counter: sale</h2>
            <UInput icon="i-bx-search" placeholder="Search trips or items…" autofocus class="w-full" />
            <p class="mt-6 text-sm text-gray-500">No items yet.</p>
        </div>
        <div class="flex flex-col gap-4">
            <CounterBasket />
            <CounterPayment />
        </div>
    </div>
</template>
