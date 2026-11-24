<script setup lang="ts">
// The <x-icon> Blade component of klia-bus (App\Support\SvgIcon::render): the stored SVG itself, with the class,
// focusable="false" and either role="img" + aria-label or aria-hidden="true" on the <svg>, no wrapper element.
// <XIcon name="bus" /> reads svg/icons/bus.svg; <XIcon name="service/taxi" /> reads svg/services/taxi.svg.
import { computed, h } from 'vue'

const icons = import.meta.glob('../svg/icons/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const services = import.meta.glob('../svg/services/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const props = withDefaults(defineProps<{ name: string; class?: string; label?: string | null }>(), { class: 'icon', label: null })

const svg = computed(() => {
    const service = props.name.startsWith('service/')
    const file = `/${service ? props.name.slice(8) : props.name}.svg`
    const source = service ? services : icons
    const key = Object.keys(source).find((k) => k.endsWith(file))
    return key ? String(source[key]).trim() : ''
})

const render = () => {
    const m = svg.value.match(/^<svg([^>]*)>([\s\S]*)<\/svg>$/)
    if (!m) return null
    const attrs: Record<string, string> = {}
    for (const a of m[1]!.matchAll(/([:\w-]+)="([^"]*)"/g)) attrs[a[1]!] = a[2]!
    return h('svg', {
        ...attrs,
        class: props.class,
        focusable: 'false',
        ...(props.label ? { role: 'img', 'aria-label': props.label } : { 'aria-hidden': 'true' }),
        innerHTML: m[2],
    })
}
</script>

<template>
    <render />
</template>
