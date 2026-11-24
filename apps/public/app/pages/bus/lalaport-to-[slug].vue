<script setup lang="ts">
// klia-bus SeoController@lalaportDestination: /bus/lalaport-to-{slug}
const route = useRoute()
</script>

<template>
    <SeoDestination :key="String(route.params.slug)" origin="lalaport" :slug="String(route.params.slug)" />
</template>
