<script setup lang="ts">
// Light / dark switch for the ttklia.com pages (not in klia-bus; added with the dark theme in _dark.scss).
// The same pill toggle as the other apps: the base layer's ThemeToggle (colour mode, saved choice,
// system setting by default).
// variant="bar": beside the language picker in the main bar.
// variant="sheet": a "Dark mode" row in the mobile menu.
withDefaults(defineProps<{ variant?: 'bar' | 'sheet' }>(), { variant: 'bar' })
</script>

<template>
    <span v-if="variant === 'bar'" class="main-bar__theme"><ThemeToggle /></span>
    <div v-else class="sheet-theme">
        <span>{{ $t('Dark mode') }}</span>
        <ThemeToggle />
    </div>
</template>
