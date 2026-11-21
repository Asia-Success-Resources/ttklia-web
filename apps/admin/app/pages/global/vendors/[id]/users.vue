<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vendor users: the people who run the vendor's tills (table `vendor_staff`, doc 32). Invite gives a new account a
// temporary password, and a temporary till PIN for each person; both are shown once. Remove ends their access to
// this vendor's tills; their sales stay on record. Permission: vendors.manage.read / write.
// TODO(pending): owner and manager roles for vendors (doc 32 "Roles") are not in the role catalogue yet.
useHead({ title: 'Vendor users' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    email: string | null
    phone_e164: string | null
    status: string
    last_login_at: string | null
}
interface Outlet {
    id: number
    code: string
    name: string
}

const route = useRoute()
const vendorId = computed(() => Number(route.params.id))
const { can } = useMe()
const api = useApi()
const toast = useToast()

const vendor = ref<{ name: string; outlets: Outlet[] } | null>(null)
async function loadVendor() {
    try {
        vendor.value = (await api.get<{ data: { name: string; outlets: Outlet[] } }>(`/admin/vendors/${vendorId.value}`)).data
    } catch {
        vendor.value = null
    }
}
onMounted(loadVendor)

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/vendors/{id}/users' })
onMounted(() => list.load())

const invited = ref<{ name: string; password: string | null; pin: string } | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({ name: '', email: '', phone_e164: '', display_name: '', vendor_outlet_ids: [] as number[] }))
function openInvite() {
    invited.value = null
    show()
}
async function save() {
    if (invited.value) {
        form.open = false
        return
    }
    await submit(async (d) => {
        const res = await api.post<{ data: { name: string; temporary_password: string | null; temporary_pin: string } }>(`/admin/vendors/${vendorId.value}/users`, {
            ...d,
            phone_e164: d.phone_e164 || null,
            display_name: d.display_name || null,
            vendor_outlet_ids: d.vendor_outlet_ids.length ? d.vendor_outlet_ids : null,
        })
        invited.value = { name: res.data.name, password: res.data.temporary_password, pin: res.data.temporary_pin }
    })
    // Keep the popup open to show the password and PIN once.
    if (invited.value) {
        form.open = true
        await list.load()
    }
}
async function remove(row: Row) {
    if (!confirm(`Remove ${row.name}'s access to this vendor's tills?`)) return
    try {
        await api.del(`/admin/vendors/${vendorId.value}/users/${row.uuid}`)
        toast.add({ title: `${row.name} removed`, color: 'success' })
        await list.load()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to remove', color: 'error' })
    }
}

const outletItems = computed(() => (vendor.value?.outlets ?? []).map((o) => ({ label: `${o.code} · ${o.name}`, value: o.id })))
const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone_e164', header: 'Phone' },
    { accessorKey: 'last_login_at', header: 'Last sign-in' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => (can('vendors.manage.write') ? [{ label: 'Remove access', icon: 'i-bx-user-x', color: 'error', onSelect: () => remove(row) }] : [])),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        :title="vendor ? `${vendor.name}: users` : 'Vendor users'"
        subject="vendor users"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UButton label="Outlets" icon="i-bx-store" color="neutral" variant="outline" :to="`/global/vendors/${vendorId}/outlets`" />
            <UButton v-if="can('vendors.manage.write')" label="Invite" icon="i-bx-plus" @click="openInvite" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="invited ? 'Sign-in Details' : 'Invite Vendor User'" :saving="form.saving" :error="form.error" :submit-label="invited ? 'Done' : 'Invite'" @submit="save">
        <template v-if="!invited">
            <OpsFormField label="Name" required :error="fieldError('name')"><UInput v-model="form.data.name" class="w-full" /></OpsFormField>
            <OpsFormField label="Email" required :error="fieldError('email')"><UInput v-model="form.data.email" type="email" class="w-full" /></OpsFormField>
            <OpsFormField label="Phone (+60…)" :error="fieldError('phone_e164')"><UInput v-model="form.data.phone_e164" class="w-full" /></OpsFormField>
            <OpsFormField label="Name on receipts" :error="fieldError('display_name')"><UInput v-model="form.data.display_name" class="w-full" /></OpsFormField>
            <OpsFormField label="Outlets (empty = all)" full :error="fieldError('vendor_outlet_ids')">
                <USelectMenu v-model="form.data.vendor_outlet_ids" :items="outletItems" value-key="value" multiple class="w-full" />
            </OpsFormField>
        </template>
        <div v-else class="space-y-3 sm:col-span-2">
            <p>Give these to <b>{{ invited.name }}</b>. They are shown only now.</p>
            <p v-if="invited.password">Temporary password: <span class="font-mono text-lg">{{ invited.password }}</span></p>
            <p v-else class="text-gray-500">They already have an account and keep their password.</p>
            <p>Till PIN: <span class="font-mono text-lg">{{ invited.pin }}</span></p>
        </div>
    </OpsFormModal>
</template>
