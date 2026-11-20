<script setup lang="ts">
// Notifications: everything sent to the signed-in user (GET /me/notifications), from the header bell's
// "View All Notifications". The page itself is OpsNotificationsPage (layers/ops-shell).
useHead({ title: 'Notifications' })
</script>

<template>
    <OpsNotificationsPage />
</template>
