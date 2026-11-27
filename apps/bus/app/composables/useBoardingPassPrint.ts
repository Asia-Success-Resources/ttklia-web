// Reprint of a paid booking's boarding passes from the browser, as ttklia-v2 printed them (bookings/show.blade.php:
// window.print() of an 80 mm receipt per seat). POST /api/ops/w/{workspace}/orders/{uuid}/reprint returns the passes
// (the same data the kiosk prints) and logs the reprint (audit_logs order.reprint).
// <BoardingPassPrint /> must be on the page: it renders the passes into the print-only area.
// TODO: print through the counter agent (doc 08) once counters have one; until then the browser's print dialog.

export interface PrintedTicket {
    terminal_name: string
    pickup: string
    drop: string
    ticket_no: string
    reference: string
    operator: string
    passenger_name: string
    passenger_id_no: string
    date: string
    time: string
    seat_no: string
    trip_no: string
    price: string
    kind: 'purchase' | 'collection'
    issued: string
    fee_summary: string
    platform: string
    ticket_type: string
    qr: string
}

interface Reprint {
    uuid: string
    bus_tickets: PrintedTicket[]
    printed_by: string | null
    printed_at: string
}

export function useBoardingPassPrint() {
    const api = useApi()
    const { slug } = useWorkspace()
    const toast = useToast()
    const passes = useState<Reprint | null>('boarding-pass-print', () => null)
    const printing = useState<string | null>('boarding-pass-printing', () => null)

    async function print(uuid: string) {
        if (printing.value) return
        printing.value = uuid
        try {
            const res = await api.post<{ data: Reprint }>(api.workspacePath(slug.value ?? '', `/orders/${uuid}/reprint`), {})
            const data = res?.data
            if (!data?.bus_tickets?.length) {
                toast.add({ title: 'Nothing to print', description: 'This order has no bus tickets.', color: 'warning' })
                return
            }
            passes.value = data
            await nextTick()
            // Let the QR codes paint before the print dialog takes its snapshot.
            await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
            window.print()
        } catch (e) {
            const problem = toProblem(e)
            toast.add({ title: 'Unable to print', description: problem?.detail ?? problem?.title ?? 'Please try again.', color: 'error' })
        } finally {
            printing.value = null
        }
    }

    return { passes, printing, print }
}
