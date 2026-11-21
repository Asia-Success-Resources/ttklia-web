import type { BookingDraft } from '~/components/FleetBookingFields.vue'

/** An empty booking form. */
export function emptyBooking(): BookingDraft {
    return {
        client_organisation_id: undefined, client_reference: '', pickup_at: '', return_at: '', hours: '',
        from_text: '', from_poi_id: undefined, from_zone_id: undefined, to_text: '', to_poi_id: undefined, to_zone_id: undefined,
        guest_name: '', guest_phone: '', pax_count: '1', vehicle_class: 'alphard', vehicles_needed: '1', flight_no: '',
        requirements: [], remarks: '', price_rm: '', toll_rm: '', discount_rm: '', sst_rm: '',
    }
}

/** A booking from the API as a form. */
export function bookingToDraft(b: Record<string, unknown>): BookingDraft {
    const n = (v: unknown) => (v === null || v === undefined ? undefined : Number(v))
    return {
        client_organisation_id: n(b.client_organisation_id), client_reference: String(b.client_reference ?? ''),
        pickup_at: toLocalInput(b.pickup_at as string), return_at: toLocalInput(b.return_at as string | null), hours: b.hours ? String(b.hours) : '',
        from_text: String(b.from_text ?? ''), from_poi_id: n((b.from_poi as { id?: number } | null)?.id), from_zone_id: n(b.from_zone_id),
        to_text: String(b.to_text ?? ''), to_poi_id: n((b.to_poi as { id?: number } | null)?.id), to_zone_id: n(b.to_zone_id),
        guest_name: String(b.guest_name ?? ''), guest_phone: String(b.guest_phone ?? ''), pax_count: String(b.pax_count ?? 1),
        vehicle_class: String(b.vehicle_class ?? 'alphard'), vehicles_needed: String(b.vehicles_needed ?? 1), flight_no: String(b.flight_no ?? ''),
        requirements: (b.requirements as string[]) ?? [], remarks: String(b.remarks ?? ''),
        price_rm: toRm(b.price_sen as number), toll_rm: toRm(b.toll_sen as number), discount_rm: toRm(b.discount_sen as number), sst_rm: toRm(b.sst_sen as number),
    }
}

/** The form as the API's body: Malaysia times as 'YYYY-MM-DD HH:mm', money in sen, empty text as null. */
export function draftToBody(d: BookingDraft): Record<string, unknown> {
    const t = (v: string) => (v ? v.replace('T', ' ') : null)
    const s = (v: string) => v.trim() || null
    return {
        client_organisation_id: d.client_organisation_id ?? null, client_reference: s(d.client_reference),
        pickup_at: t(d.pickup_at), return_at: t(d.return_at), hours: d.hours ? Number(d.hours) : null,
        from_text: d.from_text.trim(), from_poi_id: d.from_poi_id ?? null, from_zone_id: d.from_zone_id ?? null,
        to_text: s(d.to_text), to_poi_id: d.to_poi_id ?? null, to_zone_id: d.to_zone_id ?? null,
        guest_name: s(d.guest_name), guest_phone: s(d.guest_phone), pax_count: Number(d.pax_count || 1),
        vehicle_class: d.vehicle_class, vehicles_needed: Number(d.vehicles_needed || 1), flight_no: s(d.flight_no)?.toUpperCase() ?? null,
        requirements: d.requirements, remarks: s(d.remarks),
        ...(d.price_rm !== '' ? { price_sen: toSen(d.price_rm) } : {}),
        toll_sen: toSen(d.toll_rm) ?? 0, discount_sen: toSen(d.discount_rm) ?? 0, sst_sen: toSen(d.sst_rm) ?? 0,
    }
}
