<script setup lang="ts">
// klia-bus frontend/seo/partials/search.blade.php: the home page search card, limited to the services that fit the page
// (SeoController::getSearchWidgetData).
withDefaults(defineProps<{
    origin?: string
    visibleTabs?: string[]
    defaultTab?: string
    presetZone?: string | null
    presetTaxiZone?: string | null
    taxiFromKlia?: boolean
    zoneId?: number | null
    date?: string | null
}>(), { origin: 'klia2', visibleTabs: () => ['bus', 'taxi', 'car-charter'], defaultTab: 'bus', presetZone: null, presetTaxiZone: null, taxiFromKlia: true, zoneId: null, date: null })

const { user, carCharterEnabled } = useKlia()
const { locations, llpLocations } = useKliaData()
const lalaport = Boolean(useRuntimeConfig().public.kliaLalaport)
// TODO(api): TaxiLocation::searchOptions() (taxi zones and named places), for the preset and the no-Google list.
const taxiLocations: { id: number; name: string; type: string }[] = []
</script>

<template>
    <ClientOnly>
        <SearchCard
            minimal
            :visible-tabs="visibleTabs"
            :default-tab="defaultTab"
            :locations="locations"
            :llp-locations="lalaport ? llpLocations : []"
            :llp-origin-enabled="lalaport"
            :origin="origin"
            :zone="zoneId ?? undefined"
            :date="date ?? undefined"
            :preset-zone="presetZone ?? undefined"
            :preset-taxi-zone="presetTaxiZone ?? undefined"
            :taxi-from-klia="taxiFromKlia"
            :taxi-locations="taxiLocations"
            :is-mobile="false"
            :user="user ?? undefined"
            :car-charter-enabled="carCharterEnabled"
            :genting-enabled="false"
            :rentals-enabled="false"
        />
        <template #fallback>
            <div class="search-card search-card--placeholder" aria-hidden="true"></div>
        </template>
    </ClientOnly>
</template>
