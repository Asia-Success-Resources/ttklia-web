<template>
    <div class="stepper" ref="root" @keydown.esc="close(true)">
        <button
            type="button"
            class="seg__button"
            :id="id"
            aria-haspopup="dialog"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="id + '-popover'"
            ref="trigger"
            @click="open ? close() : (open = true)"
        >
            {{ summary }}
            <svg-icon name="chevron-down" class="icon-sm seg__chevron" />
        </button>
        <Transition name="pop">
            <div v-if="open" class="popover-card stepper__popover" :id="id + '-popover'" role="dialog" :aria-label="$t('Passengers')">
                <div v-for="row in rows" :key="row.key" class="stepper__row">
                    <span class="stepper__name" :id="id + '-' + row.key">{{ $t(row.label) }}</span>
                    <div class="stepper__controls" role="group" :aria-labelledby="id + '-' + row.key">
                        <button type="button" class="stepper__btn" :disabled="counts[row.key] <= 0" @click="change(row.key, -1)" :aria-label="$t('Fewer') + ' ' + $t(row.label)">
                            <svg-icon name="minus" />
                        </button>
                        <output class="stepper__value" aria-live="polite">{{ counts[row.key] }}</output>
                        <button type="button" class="stepper__btn" @click="change(row.key, 1)" :aria-label="$t('More') + ' ' + $t(row.label)">
                            <svg-icon name="plus" />
                        </button>
                    </div>
                </div>
                <button type="button" class="btn btn-primary w-100 mt-3" @click="close(true)">{{ $t('Done') }}</button>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { trans } from 'laravel-vue-i18n';
import SvgIcon from '../SvgIcon.vue';

const MAX_PAX = 9;

const props = defineProps({
    id: { type: String, required: true },
    counts: { type: Object, required: true },
    showStaff: { type: Boolean, default: false },
});
const emit = defineEmits(['change']);

const open = ref(false);
const root = ref(null);
const trigger = ref(null);

const rows = computed(() => [
    { key: 'adult', label: 'Adult' },
    { key: 'child', label: 'Child' },
    { key: 'senior', label: 'Senior' },
    ...(props.showStaff ? [{ key: 'staff', label: 'Staff' }] : []),
]);

const total = computed(() => Object.values(props.counts).reduce((sum, n) => sum + Number(n || 0), 0));

const summary = computed(() => total.value + ' ' + (total.value === 1 ? trans('Passenger') : trans('Passengers')));

const change = (key, delta) => {
    if (delta > 0 && total.value >= MAX_PAX) {
        Swal.fire({
            icon: 'error',
            title: trans('Error') + '!',
            text: trans('You cannot book more than 9 tickets.'),
        });
        return;
    }
    emit('change', key, Math.max(0, props.counts[key] + delta));
};

const close = (returnFocus = false) => {
    open.value = false;
    if (returnFocus) {
        trigger.value?.focus();
    }
};

const onDocumentClick = (event) => {
    if (open.value && root.value && !root.value.contains(event.target)) {
        close();
    }
};

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));
</script>
