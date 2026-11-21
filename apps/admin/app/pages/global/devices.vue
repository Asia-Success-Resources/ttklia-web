<script setup lang="ts">
// Devices: every agent, kiosk, handheld and till (table `devices`). Permission: global.devices.read / write (doc 27).
useHead({ title: 'Devices' })
</script>

<template>
    <DeviceList title="Devices" subject="devices" write-permission="global.devices.write" />
</template>
