<script setup lang="ts">
// klia-bus frontend/seo/partials/departures.blade.php: departures on this bus route for the chosen day (today by
// default), shown before any other content. Each one opens the trip results page for that day.
// TODO(api): the departures (klia-bus RouteDepartures::find) from a public ttklia-api trip search; until it exists
// the section shows klia-bus's own "not available" state.
import { trans } from 'laravel-vue-i18n'
import { departureDays, fmt, ymd, type BusOrigin } from '~/klia/seo'

export interface Departure { id: number; time: string; operator: string; logo: string | null; seats: number; price: number | null }

const props = defineProps<{
    busOrigin: BusOrigin
    destination: { name: string; slug: string }
    date: Date
    departures: { zone: { id: number; name: string } | null; trips: Departure[]; failed: boolean }
}>()
const { locale } = useKlia()

const days = departureDays()
const baseUrl = computed(() => props.busOrigin.prefix + props.destination.slug)
const isToday = (d: Date) => ymd(d) === ymd(days[0]!)
const dayLabel = (d: Date) => (isToday(d) ? trans('Today') : ymd(d) === ymd(days[1]!) ? trans('Tomorrow') : fmt(d, locale.value, { weekday: 'short' }))
const tripsUrl = (d: Date) => props.departures.zone
    ? '/trips?' + new URLSearchParams({ zone_id: String(props.departures.zone.id), date: ymd(d), adult: '1', child: '0', senior: '0', staff: '0', origin: props.busOrigin.key }).toString()
    : undefined
const nextDay = computed(() => days.find((d) => d > props.date))
const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>

<template>
    <section id="departures" class="departures" aria-labelledby="departures-title">
        <div class="departures__head">
            <h2 id="departures-title">{{ $t('Buses from :origin to :place', { origin: busOrigin.name, place: destination.name }) }}</h2>
            <p>{{ fmt(date, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
        </div>

        <nav class="day-picker" :aria-label="$t('Choose a day')">
            <NuxtLink v-for="day in days" :key="ymd(day)" :to="(isToday(day) ? baseUrl : `${baseUrl}?date=${ymd(day)}`) + '#departures'"
                      class="day-picker__day" :aria-current="ymd(day) === ymd(date) ? 'date' : undefined" rel="nofollow">
                <span class="day-picker__name">{{ dayLabel(day) }}</span>
                <span class="day-picker__date">{{ fmt(day, locale, { day: 'numeric', month: 'short' }) }}</span>
            </NuxtLink>
        </nav>

        <template v-if="departures.trips.length">
            <ul class="departure-list">
                <li v-for="trip in departures.trips" :key="trip.id" class="departure">
                    <span class="departure__time">{{ trip.time }}</span>
                    <span class="departure__operator">
                        <img v-if="trip.logo" :src="trip.logo" alt="" width="72" height="28" loading="lazy">
                        <span>{{ trip.operator }}</span>
                    </span>
                    <span class="departure__seats" :class="{ 'is-low': trip.seats <= 5 }">
                        {{ $tChoice(':count seat left|:count seats left', trip.seats, { count: String(trip.seats) }) }}
                    </span>
                    <span class="departure__price">
                        <template v-if="trip.price !== null">
                            <strong>RM {{ money(trip.price) }}</strong>
                            <small>{{ $t('per adult') }}</small>
                        </template>
                    </span>
                    <a :href="tripsUrl(date)" class="btn btn-primary departure__cta">{{ $t('Select') }}</a>
                </li>
            </ul>
            <p class="departures__note">{{ $t('Prices include the terminal fee. Choose seats and passengers on the next step.') }}</p>
        </template>
        <div v-else-if="departures.failed || !departures.zone" class="departures__empty">
            <XIcon name="calendar-event" class="icon icon-xl" />
            <p>{{ $t('Live departures are not available for this route right now. Search above to see buses for any date.') }}</p>
        </div>
        <div v-else class="departures__empty">
            <XIcon name="clock" class="icon icon-xl" />
            <p>{{ isToday(date) ? $t('No more buses on this route today.') : $t('No buses on this route on this day.') }}</p>
            <NuxtLink v-if="nextDay" :to="`${baseUrl}?date=${ymd(nextDay)}#departures`" class="btn btn-outline-primary" rel="nofollow">
                {{ $t('See :day', { day: dayLabel(nextDay) + ', ' + fmt(nextDay, locale, { day: 'numeric', month: 'short' }) }) }}
            </NuxtLink>
        </div>
    </section>
</template>
