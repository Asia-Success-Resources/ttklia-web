<script setup lang="ts">
// Kiosks: every kiosk app (table `devices`, doc 25 "Kiosk ads and kiosk settings"). Permission: global.settings_kiosks.read / write.
useHead({ title: 'Kiosks' })
</script>

<template>
    <DeviceList title="Kiosks" subject="kiosks" type="kiosk_app" write-permission="global.settings_kiosks.write" />
</template>
