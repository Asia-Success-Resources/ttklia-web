<template>
    <div class="datefield" ref="root" @keydown.esc.stop="close(true)">
        <button
            type="button"
            class="seg__button"
            :id="id"
            ref="trigger"
            aria-haspopup="dialog"
            :aria-expanded="open ? 'true' : 'false'"
            @click="open ? close() : show()"
        >
            <span :class="{ 'seg__placeholder': !modelValue }">{{ modelValue ? display(modelValue) : placeholder }}</span>
            <svg-icon name="calendar" class="icon-sm seg__chevron" />
        </button>

        <Transition :name="sheet ? 'sheet' : 'pop'">
            <div v-if="open" class="datefield__layer" :class="{ 'is-sheet': sheet, 'is-right': alignRight && !sheet }">
                <div v-if="sheet" class="datefield__backdrop" @click="close(true)"></div>
                <div class="datefield__pop" :class="{ 'has-time': withTime, 'is-double': !withTime && !sheet }"
                     role="dialog" :aria-label="dialogLabel" ref="pop">
                    <div class="datefield__quick">
                        <button type="button" class="datefield__chip" :disabled="!isSelectable(today)" @click="pickDay(today)">{{ $t('Today') }}</button>
                        <button type="button" class="datefield__chip" :disabled="!isSelectable(tomorrow)" @click="pickDay(tomorrow)">{{ $t('Tomorrow') }}</button>
                        <button v-if="sheet" type="button" class="datefield__close" @click="close(true)" :aria-label="$t('Close')">
                            <svg-icon name="x" />
                        </button>
                    </div>

                    <div class="datefield__body">
                        <div class="datefield__months">
                            <div v-for="(month, index) in months" :key="month.key" class="datefield__month">
                                <div class="datefield__head">
                                    <button v-if="index === 0" type="button" class="datefield__nav" :disabled="!canPrev" @click="shiftMonth(-1)" :aria-label="$t('Previous month')">
                                        <svg-icon name="chevron-left" />
                                    </button>
                                    <span v-else class="datefield__nav-spacer"></span>
                                    <span class="datefield__title" aria-live="polite">{{ month.title }}</span>
                                    <button v-if="index === months.length - 1" type="button" class="datefield__nav" :disabled="!canNext" @click="shiftMonth(1)" :aria-label="$t('Next month')">
                                        <svg-icon name="chevron-right" />
                                    </button>
                                    <span v-else class="datefield__nav-spacer"></span>
                                </div>
                                <table class="datefield__grid" role="grid" :aria-label="month.title">
                                    <thead>
                                        <tr>
                                            <th v-for="day in weekdays" :key="day.long" scope="col" :abbr="day.long">{{ day.short }}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(week, w) in month.weeks" :key="w">
                                            <td v-for="(cell, d) in week" :key="d" role="gridcell" :aria-selected="cell && isSameDay(cell, selectedDay) ? 'true' : null">
                                                <button
                                                    v-if="cell"
                                                    type="button"
                                                    class="datefield__day"
                                                    :class="{
                                                        'is-today': isSameDay(cell, today),
                                                        'is-selected': isSameDay(cell, selectedDay),
                                                    }"
                                                    :disabled="!isSelectable(cell)"
                                                    :tabindex="isSameDay(cell, focusDay) ? 0 : -1"
                                                    :data-day="dayKey(cell)"
                                                    :aria-label="longDate(cell)"
                                                    @click="pickDay(cell)"
                                                    @keydown="onDayKey($event, cell)"
                                                >{{ cell.getDate() }}</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div v-if="withTime" class="datefield__times">
                            <p class="datefield__times-label" :id="id + '-time-label'">{{ $t('Time') }}</p>
                            <div class="datefield__slots" role="listbox" :aria-labelledby="id + '-time-label'" ref="slotList">
                                <button
                                    v-for="slot in slots"
                                    :key="slot.minutes"
                                    type="button"
                                    role="option"
                                    class="datefield__slot"
                                    :class="{ 'is-selected': slot.minutes === selectedMinutes }"
                                    :aria-selected="slot.minutes === selectedMinutes ? 'true' : 'false'"
                                    :disabled="!slotAllowed(slot.minutes)"
                                    @click="pickTime(slot.minutes)"
                                >{{ slot.label }}</button>
                            </div>
                        </div>
                    </div>

                    <div v-if="withTime" class="datefield__foot">
                        <span class="datefield__summary">{{ draftValue ? display(draftValue) : $t('Choose a date and time') }}</span>
                        <button type="button" class="btn btn-primary" :disabled="!draftValue" @click="confirm">{{ $t('Done') }}</button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
// Date (and optional time) picker for the search forms. Two months side by
// side for plain dates, a month plus time slots for pick-up times, and a
// bottom sheet on phones. Built on the WAI-ARIA date picker dialog pattern.
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { trans } from 'laravel-vue-i18n';
import SvgIcon from '../SvgIcon.vue';

const props = defineProps({
    modelValue: { type: Date, default: null },
    id: { type: String, required: true },
    min: { type: Date, default: null },
    max: { type: Date, default: null },
    withTime: { type: Boolean, default: false },
    minuteStep: { type: Number, default: 15 },
    placeholder: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const LOCALES = { en: 'en-GB', zh: 'zh-CN', ms: 'ms-MY', th: 'th-TH' };
const locale = LOCALES[document.documentElement.lang] ?? document.documentElement.lang ?? 'en-GB';

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const isSameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);
const minDay = computed(() => props.min ? startOfDay(props.min) : null);
const maxDay = computed(() => props.max ? startOfDay(props.max) : null);

const open = ref(false);
const root = ref(null);
const trigger = ref(null);
const pop = ref(null);
const slotList = ref(null);
const sheet = ref(false);
const alignRight = ref(false);

// Draft state while the dialog is open (committed on pick / Done).
const selectedDay = ref(props.modelValue ? startOfDay(props.modelValue) : null);
const selectedMinutes = ref(props.modelValue && props.withTime ? props.modelValue.getHours() * 60 + props.modelValue.getMinutes() : null);
const focusDay = ref(selectedDay.value ?? minDay.value ?? today);
const viewMonth = ref(new Date(focusDay.value.getFullYear(), focusDay.value.getMonth(), 1));

const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
const longFormat = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortFormat = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' });
const timeFormat = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true });

const longDate = (d) => longFormat.format(d);
const display = (d) => props.withTime ? `${shortFormat.format(d)} · ${timeFormat.format(d)}` : shortFormat.format(d);
const dialogLabel = computed(() => props.withTime ? trans('Choose a date and time') : trans('Choose a date'));

// Monday-first weekday headers in the page's language.
const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i); // 1 Jan 2024 is a Monday
    return {
        short: new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d),
        long: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d),
    };
});

const buildMonth = (first) => {
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells = Array(offset).fill(null).concat(Array.from({ length: days }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1)));
    while (cells.length % 7) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return { key: dayKey(first), title: monthTitle.format(first), weeks };
};

const months = computed(() => {
    const count = !props.withTime && !sheet.value ? 2 : 1;
    return Array.from({ length: count }, (_, i) => buildMonth(new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + i, 1)));
});

const isSelectable = (d) => (!minDay.value || d >= minDay.value) && (!maxDay.value || d <= maxDay.value);

const canPrev = computed(() => !minDay.value || viewMonth.value > new Date(minDay.value.getFullYear(), minDay.value.getMonth(), 1));
const canNext = computed(() => {
    if (!maxDay.value) return true;
    const lastShown = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + months.value.length - 1, 1);
    return lastShown < new Date(maxDay.value.getFullYear(), maxDay.value.getMonth(), 1);
});

const shiftMonth = (n) => {
    viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + n, 1);
};

// Time slots
const slots = computed(() => {
    const list = [];
    for (let m = 0; m < 24 * 60; m += props.minuteStep) {
        list.push({ minutes: m, label: timeFormat.format(new Date(2024, 0, 1, Math.floor(m / 60), m % 60)) });
    }
    return list;
});

const withMinutes = (day, minutes) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60);

const slotAllowed = (minutes) => {
    if (!selectedDay.value) return false;
    const at = withMinutes(selectedDay.value, minutes);
    return (!props.min || at >= props.min) && (!props.max || at <= props.max || !isSameDay(at, props.max));
};

const draftValue = computed(() => selectedDay.value && selectedMinutes.value !== null && slotAllowed(selectedMinutes.value)
    ? withMinutes(selectedDay.value, selectedMinutes.value) : null);

const focusDayButton = async () => {
    await nextTick();
    pop.value?.querySelector(`[data-day="${dayKey(focusDay.value)}"]`)?.focus();
};

const ensureVisible = (d) => {
    const first = viewMonth.value;
    const last = new Date(first.getFullYear(), first.getMonth() + months.value.length, 0);
    if (d < first) viewMonth.value = new Date(d.getFullYear(), d.getMonth(), 1);
    if (d > last) viewMonth.value = new Date(d.getFullYear(), d.getMonth() - months.value.length + 1, 1);
};

const scrollToSlot = async () => {
    await nextTick();
    const list = slotList.value;
    const target = list?.querySelector('.is-selected') ?? list?.querySelector('.datefield__slot:not(:disabled)');
    if (list && target) list.scrollTop = target.offsetTop - list.offsetTop - 8;
};

const pickDay = (d) => {
    if (!isSelectable(d)) return;
    selectedDay.value = d;
    focusDay.value = d;
    ensureVisible(d);
    if (!props.withTime) {
        emit('update:modelValue', d);
        close(true);
        return;
    }
    if (selectedMinutes.value === null || !slotAllowed(selectedMinutes.value)) {
        // Suggest 9:00 am, or the earliest allowed slot after it.
        const allowed = slots.value.filter(s => slotAllowed(s.minutes));
        selectedMinutes.value = (allowed.find(s => s.minutes >= 9 * 60) ?? allowed[0])?.minutes ?? null;
    }
    scrollToSlot();
};

const pickTime = (minutes) => {
    selectedMinutes.value = minutes;
};

const confirm = () => {
    if (!draftValue.value) return;
    emit('update:modelValue', draftValue.value);
    close(true);
};

const onDayKey = (event, d) => {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next = null;
    if (moves[event.key] !== undefined) next = addDays(d, moves[event.key]);
    else if (event.key === 'PageUp') next = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate());
    else if (event.key === 'PageDown') next = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    else if (event.key === 'Home') next = addDays(d, -((d.getDay() + 6) % 7));
    else if (event.key === 'End') next = addDays(d, 6 - ((d.getDay() + 6) % 7));
    if (!next) return;
    event.preventDefault();
    if (minDay.value && next < minDay.value) next = minDay.value;
    if (maxDay.value && next > maxDay.value) next = maxDay.value;
    focusDay.value = next;
    ensureVisible(next);
    focusDayButton();
};

const mq = window.matchMedia('(max-width: 767.98px)');
const syncSheet = () => { sheet.value = mq.matches; };

const show = () => {
    syncSheet();
    const rect = trigger.value.getBoundingClientRect();
    alignRight.value = rect.left > window.innerWidth / 2;
    selectedDay.value = props.modelValue ? startOfDay(props.modelValue) : null;
    selectedMinutes.value = props.modelValue && props.withTime ? props.modelValue.getHours() * 60 + props.modelValue.getMinutes() : null;
    focusDay.value = selectedDay.value ?? (minDay.value && minDay.value > today ? minDay.value : today);
    viewMonth.value = new Date(focusDay.value.getFullYear(), focusDay.value.getMonth(), 1);
    open.value = true;
    if (sheet.value) document.body.classList.add('no-scroll');
    focusDayButton();
    if (props.withTime) scrollToSlot();
};

const close = (returnFocus = false) => {
    if (!open.value) return;
    open.value = false;
    document.body.classList.remove('no-scroll');
    if (returnFocus) trigger.value?.focus();
};

watch(() => props.modelValue, (value) => {
    if (!open.value) {
        selectedDay.value = value ? startOfDay(value) : null;
    }
});

const onDocumentClick = (event) => {
    if (open.value && !sheet.value && root.value && !root.value.contains(event.target)) close();
};

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick);
    document.body.classList.remove('no-scroll');
});
</script>
