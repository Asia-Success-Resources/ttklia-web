<script setup lang="ts">
// klia-bus frontend/seo/partials/link-list.blade.php.
import type { Link } from '~/klia/explore'
defineProps<{ title: string; links: Link[] }>()
</script>

<template>
    <aside class="side-card" aria-labelledby="side-links-title">
        <h2 id="side-links-title">{{ title }}</h2>
        <ul class="link-list">
            <li v-for="link in links" :key="link.url">
                <a :href="link.url">
                    {{ link.label }}
                    <small v-if="link.meta">{{ link.meta }}</small>
                </a>
            </li>
        </ul>
    </aside>
</template>
