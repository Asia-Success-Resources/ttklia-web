<script setup lang="ts">
// www.ttklia.com is the site copied from klia-bus (layouts/klia.vue, Bootstrap); teeko.ai keeps the Teeko layout
// (layouts/default.vue, Nuxt UI). A page can still name its own layout with definePageMeta({ layout }).
const { isTeeko } = useBrand()
const route = useRoute()
const layout = computed(() => (route.meta.layout as 'default' | 'klia' | undefined) ?? (isTeeko.value ? 'default' : 'klia'))
</script>

<template>
    <UApp :toaster="{ position: 'top-right' }">
        <NuxtLayout :name="layout">
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>
