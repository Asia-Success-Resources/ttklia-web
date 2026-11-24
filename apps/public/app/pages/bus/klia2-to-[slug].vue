<script setup lang="ts">
// klia-bus SeoController@destination: /bus/klia2-to-{slug}
const route = useRoute()
</script>

<template>
    <SeoDestination :key="String(route.params.slug)" origin="klia2" :slug="String(route.params.slug)" />
</template>
