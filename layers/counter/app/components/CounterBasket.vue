<script setup lang="ts">
// The basket: lines, voucher, total (doc 09, counter layer). Prices come from the API's quote.
const basket = useBasketStore()
</script>

<template>
    <div class="rounded-2xl border border-(--app-border) bg-(--app-card) p-4">
        <h3 class="mb-3 font-semibold">Basket</h3>
        <p v-if="basket.lines.length === 0" class="text-sm text-gray-500">Empty</p>
        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <li v-for="line in basket.lines" :key="line.key" class="flex items-center justify-between py-2 text-sm">
                <span>{{ line.quantity }} × {{ line.label }}</span>
                <span class="flex items-center gap-2">
                    {{ formatSen(line.unit_price_sen * line.quantity) }}
                    <UButton icon="i-bx-x" size="xs" color="neutral" variant="ghost" aria-label="Remove" @click="basket.remove(line.key)" />
                </span>
            </li>
        </ul>
        <UInput v-model="basket.voucherCode" placeholder="Voucher code" class="mt-3 w-full" />
        <div class="mt-4 flex justify-between text-lg font-bold">
            <span>Total</span><span>{{ formatSen(basket.totalSen) }}</span>
        </div>
    </div>
</template>
