<script setup lang="ts">
// The staff skeleton: fixed sidebar (290 px, 90 px collapsed), header, page body (doc 09).
const { collapsed, mobileOpen } = useOpsShell()
</script>

<template>
    <UApp :toaster="{ position: 'top-right' }">
        <div class="min-h-screen bg-(--ops-body)">
            <OpsSidebar />
            <div
                v-if="mobileOpen"
                class="fixed inset-0 z-40 bg-black/50 lg:hidden"
                @click="mobileOpen = false"
            />
            <div class="flex min-h-screen flex-col transition-all duration-300" :class="collapsed ? 'lg:ml-[90px]' : 'lg:ml-[290px]'">
                <OpsHeader />
                <main class="mx-auto w-full max-w-(--breakpoint-2xl) flex-1 p-4 md:p-6">
                    <slot />
                </main>
            </div>
        </div>
    </UApp>
</template>
