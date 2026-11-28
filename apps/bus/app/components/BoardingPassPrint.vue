<script setup lang="ts">
import { renderSVG } from 'uqr'
import type { PrintedTicket } from '~/composables/useBoardingPassPrint'

// The boarding passes to print, one 80 mm pass per seat, laid out as ttklia-v2's bookings/receipt.blade.php:
// terminal and destination, date, departure, platform, operator, trip no, seat, ticket type, fees and price,
// sold/printed by, the QR the gates scan, and the luggage and boarding notes.
// `preview` shows them inside the page (the booking page's right column); without it the component is the
// print-only area that useBoardingPassPrint() fills and the browser prints (hidden on screen).
const props = defineProps<{ tickets?: PrintedTicket[]; printedBy?: string | null; preview?: boolean }>()

const { passes } = useBoardingPassPrint()
const list = computed(() => props.tickets ?? passes.value?.bus_tickets ?? [])
const printedBy = computed(() => props.printedBy ?? passes.value?.printed_by ?? null)
const printedAt = computed(() => klTime(passes.value?.printed_at ?? new Date().toISOString(), { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }))
const qr = (value: string) => renderSVG(value, { border: 1 })

function rows(t: PrintedTicket): [string, string, boolean?][] {
    return [
        ['Departure Time', t.time],
        ['Platform', t.platform || '-', true],
        ['Operator', t.operator],
        ['Trip No', t.trip_no],
    ]
}
function seatRows(t: PrintedTicket): [string, string, boolean?][] {
    return [
        ['Seat No', t.seat_no, true],
        ['Ticket Type', t.ticket_type],
        ['Ticket No', t.ticket_no],
        [t.kind === 'collection' ? 'Booking Ref' : 'Order', t.reference],
        ...(t.passenger_name ? [['Passenger', t.passenger_name] as [string, string]] : []),
    ]
}
</script>

<template>
    <Teleport to="body" :disabled="preview">
        <div :id="preview ? undefined : 'bp-print'" :class="preview ? 'space-y-4' : ''">
            <div v-for="(t, i) in list" :key="t.ticket_no + i" class="bp-pass">
                <div class="bp-center">
                    <img src="/img/logo.png" alt="" class="bp-logo">
                    <h2 class="bp-title">{{ t.terminal_name }}</h2>
                    <p class="bp-strong">to {{ t.drop }}</p>
                    <p class="bp-strong bp-mt">Date: {{ t.date }}</p>
                </div>
                <div class="bp-rule" />
                <div v-for="[label, value, bold] in rows(t)" :key="label" class="bp-row">
                    <span>{{ label }}</span><span :class="{ 'bp-b': bold }">{{ value }}</span>
                </div>
                <div class="bp-rule" />
                <div v-for="[label, value, bold] in seatRows(t)" :key="label" class="bp-row">
                    <span>{{ label }}</span><span :class="{ 'bp-b': bold }">{{ value }}</span>
                </div>
                <p v-if="t.fee_summary" class="bp-small">{{ t.fee_summary }}</p>
                <div class="bp-row bp-price">
                    <span>{{ t.kind === 'collection' ? 'COLLECTION' : 'PRICE' }}</span><span>{{ t.price }}</span>
                </div>
                <div class="bp-rule" />
                <div class="bp-row"><span>Issued</span><span>{{ t.issued }}</span></div>
                <div v-if="printedBy" class="bp-row"><span>Printed By</span><span>{{ printedBy }}</span></div>
                <div class="bp-row"><span>Printed At</span><span>{{ printedAt }}</span></div>
                <div class="bp-rule" />
                <div class="bp-center">
                    <!-- eslint-disable-next-line vue/no-v-html -- an SVG we render from the ticket's own QR token -->
                    <div class="bp-qr" v-html="qr(t.qr)" />
                    <p class="bp-strong">{{ t.ticket_no }}-{{ t.seat_no }}</p>
                </div>
                <div class="bp-rule" />
                <p class="bp-note">
                    **************************<br>
                    COMPANY WILL NOT BE RESPONSIBLE<br>
                    FOR ANY LUGGAGE LOSS<br><br>
                    KINDLY SCAN YOUR TICKET<br>
                    BEFORE BOARDING
                </p>
            </div>
        </div>
    </Teleport>
</template>

<style>
.bp-pass {
    width: 100%;
    max-width: 80mm;
    margin: 0 auto;
    padding: 5mm;
    box-sizing: border-box;
    background: #fff;
    color: #000;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
}
.bp-center { text-align: center; }
.bp-logo { display: block; height: 25px; max-width: 60%; margin: 0 auto; object-fit: contain; }
.bp-title { margin: 10px 0 3px; font-size: 16px; font-weight: 700; }
.bp-strong { margin: 0; font-size: 14px; font-weight: 700; }
.bp-mt { margin-top: 8px; }
.bp-rule { border-top: 1px dashed #000; margin: 10px 0; }
.bp-row { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 5px; }
.bp-row > span:last-child { text-align: right; }
.bp-b { font-weight: 700; }
.bp-price { font-size: 15px; font-weight: 700; }
.bp-small { margin: 0 0 5px; font-size: 11px; }
.bp-qr { width: 61mm; margin: 0 auto 5px; } /* 35% bigger than 45mm (28 Nov 2026), easier for the turnstiles */
.bp-qr svg { display: block; width: 100%; height: auto; }
.bp-note { margin: 0; text-align: center; font-size: 11px; line-height: 1.6; }

#bp-print { display: none; }
@media print {
    @page { margin: 0; size: 80mm auto; }
    body > *:not(#bp-print) { display: none !important; }
    body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    #bp-print { display: block !important; width: 80mm; }
    #bp-print .bp-pass { break-after: page; page-break-after: always; }
    #bp-print .bp-pass:last-child { break-after: auto; page-break-after: auto; }
}
</style>
