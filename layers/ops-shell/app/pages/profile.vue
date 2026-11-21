<script setup lang="ts">
// Account settings (/profile), in every app. Taxi and vendor also have /{location}/profile so the sidebar keeps
// the workspace; this one serves the apps without a location in the path, and is reachable from any workspace.
useHead({ title: 'Account Settings' })
</script>

<template>
    <OpsAccountSettings />
</template>
