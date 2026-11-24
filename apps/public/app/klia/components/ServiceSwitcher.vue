<template>
    <div class="switcher" ref="root">
        <div class="switcher__list" role="tablist" :aria-label="label" ref="list" @keydown="onKeydown">
            <button
                v-for="(service, index) in services"
                :key="service.key"
                :ref="el => tabs[index] = el"
                type="button"
                role="tab"
                class="switcher__tab"
                :id="'service-tab-' + service.key"
                :aria-selected="service.key === modelValue ? 'true' : 'false'"
                :aria-controls="panelId"
                :tabindex="service.key === modelValue ? 0 : -1"
                @click="select(service.key)"
            >
                <svg-icon :name="'service/' + service.icon" class="switcher__icon" />
                <span class="switcher__label">{{ service.label }}</span>
            </button>
            <span class="switcher__underline" aria-hidden="true" :style="underlineStyle"></span>
        </div>
    </div>
</template>

<script setup>
// Trip.com style service row: icon over label, a sliding underline under the
// active service, and the WAI-ARIA tabs keyboard pattern with roving tabindex.
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import SvgIcon from './SvgIcon.vue';

const props = defineProps({
    services: { type: Array, required: true },
    modelValue: { type: String, required: true },
    panelId: { type: String, required: true },
    label: { type: String, default: 'Services' },
});
const emit = defineEmits(['update:modelValue']);

const root = ref(null);
const list = ref(null);
const tabs = ref([]);
const underline = ref({ x: 0, w: 0, ready: false });

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const underlineStyle = computed(() => ({
    transform: `translateX(${underline.value.x}px) scaleX(${underline.value.w})`,
    opacity: underline.value.ready ? 1 : 0,
}));

const activeIndex = () => props.services.findIndex(s => s.key === props.modelValue);

const measure = () => {
    const tab = tabs.value[activeIndex()];
    if (!tab) {
        return;
    }
    underline.value = { x: tab.offsetLeft, w: tab.offsetWidth, ready: true };
};

const centreActive = () => {
    const tab = tabs.value[activeIndex()];
    const scroller = list.value;
    if (!tab || !scroller || scroller.scrollWidth <= scroller.clientWidth) {
        return;
    }
    const left = tab.offsetLeft - (scroller.clientWidth - tab.offsetWidth) / 2;
    scroller.scrollTo({ left, behavior: reducedMotion() ? 'auto' : 'smooth' });
};

const select = (key) => {
    emit('update:modelValue', key);
};

const onKeydown = (event) => {
    const count = props.services.length;
    let index = activeIndex();
    switch (event.key) {
        case 'ArrowRight': index = (index + 1) % count; break;
        case 'ArrowLeft': index = (index - 1 + count) % count; break;
        case 'Home': index = 0; break;
        case 'End': index = count - 1; break;
        default: return;
    }
    event.preventDefault();
    select(props.services[index].key);
    nextTick(() => tabs.value[index]?.focus());
};

watch(() => props.modelValue, async () => {
    await nextTick();
    measure();
    centreActive();
});

let resizeObserver = null;
onMounted(() => {
    measure();
    centreActive();
    if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(list.value);
    }
    // Roboto arriving late changes label widths.
    document.fonts?.ready?.then(measure);
});

onBeforeUnmount(() => resizeObserver?.disconnect());
</script>
