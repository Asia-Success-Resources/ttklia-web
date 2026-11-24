<template>
    <span v-if="markup" class="svg-icon icon" v-html="markup" :role="label ? 'img' : null" :aria-label="label || null" :aria-hidden="label ? null : 'true'"></span>
</template>

<script setup>
// Vue counterpart of the <x-icon> Blade component. Reads the same SVG files at
// build time so the frontend never needs the Font Awesome webfont.
import { computed } from 'vue';

// query + import is the current Vite form; the old { as: 'raw' } hands back a
// module object on newer versions, which rendered as "[object Module]".
const icons = import.meta.glob('../svg/icons/*.svg', { query: '?raw', import: 'default', eager: true });
const services = import.meta.glob('../svg/services/*.svg', { query: '?raw', import: 'default', eager: true });

const props = defineProps({
    name: { type: String, required: true },
    label: { type: String, default: null },
});

const markup = computed(() => {
    const isService = props.name.startsWith('service/');
    const file = (isService ? props.name.slice(8) : props.name) + '.svg';
    const source = isService ? services : icons;
    const key = Object.keys(source).find(k => k.endsWith('/' + file));
    const svg = key ? source[key] : '';
    return typeof svg === 'string' ? svg : (svg?.default ?? '');
});
</script>
