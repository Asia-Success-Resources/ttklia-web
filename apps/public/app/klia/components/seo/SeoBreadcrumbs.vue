<script setup lang="ts">
// klia-bus frontend/seo/partials/breadcrumbs.blade.php.
import type { Crumb } from '~/klia/seo'
defineProps<{ crumbs: Crumb[] }>()
</script>

<template>
    <nav class="crumbs" :aria-label="$t('Breadcrumb')">
        <ol class="breadcrumb">
            <template v-for="(crumb, i) in crumbs" :key="i">
                <li v-if="i === crumbs.length - 1" class="breadcrumb-item active" aria-current="page">{{ crumb.label }}</li>
                <li v-else class="breadcrumb-item"><a :href="crumb.url">{{ crumb.label }}</a></li>
            </template>
        </ol>
    </nav>
</template>
