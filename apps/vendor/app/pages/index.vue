<script setup lang="ts">
// The outlets this vendor user can open (doc 32: a vendor with several outlets switches between them
// like a workspace; vendor.ttklia.com/{outlet}).
useHead({ title: 'Choose outlet' })
definePageMeta({ layout: false })
const { me } = useMe()
// TODO(api): /me lists workspaces; doc 27 does not say yet how a vendor user's outlets appear there.
const outlets = computed(() => (me.value?.workspaces ?? []).filter((w) => (w.type as string) === 'vendor_outlet'))
</script>

<template>
    <UApp :toaster="{ position: 'top-right' }">
        <div class="flex min-h-screen items-center justify-center p-6">
            <div class="w-full max-w-md rounded-2xl border border-(--app-border) bg-(--app-card) p-6">
                <h1 class="mb-4 text-lg font-semibold">Choose an outlet</h1>
                <p v-if="outlets.length === 0" class="text-sm text-gray-500">No outlets available.</p>
                <ul class="flex flex-col gap-2">
                    <li v-for="w in outlets" :key="w.slug">
                        <UButton :to="`/${w.slug}`" :label="w.name" block color="neutral" variant="outline" />
                    </li>
                </ul>
            </div>
        </div>
    </UApp>
</template>
