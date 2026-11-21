<script setup lang="ts">
// A status cell as on fleet-management's boards: a coloured block with the status in white. When `options` are
// given it is clickable and opens the status picker (a popover of coloured buttons, as there); picking emits `change`.
const props = withDefaults(defineProps<{ status: string | null | undefined; options?: string[] }>(), { options: () => [] })
const emit = defineEmits<{ change: [status: string] }>()

const menu = reactive({ open: false, x: 0, y: 0 })
const editable = computed(() => props.options.length > 0)

function openMenu(event: MouseEvent) {
    if (!editable.value) return
    if (menu.open) return close()
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    menu.x = rect.left + rect.width / 2
    menu.y = rect.bottom + 8
    menu.open = true
}
function close() {
    menu.open = false
}
function pick(status: string) {
    close()
    if (status !== props.status) emit('change', status)
}
function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
    <div
        class="flex h-9 min-w-24 select-none items-center justify-center rounded-sm px-3 text-[13px] font-medium text-white"
        :class="[editable ? 'cursor-pointer' : '', menu.open ? 'outline outline-2 -outline-offset-2 outline-[#0073ea]' : '']"
        :style="{ backgroundColor: statusColor(props.status) }"
        :title="editable ? 'Change status' : undefined"
        @click="openMenu"
    >
        {{ statusLabel(props.status) }}
    </div>

    <Teleport to="body">
        <template v-if="menu.open">
            <div class="fixed inset-0 z-[100]" @click="close" />
            <div
                class="fixed z-[101] flex w-[220px] -translate-x-1/2 flex-col gap-2 rounded-lg bg-[#30324e] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
            >
                <!-- Caret -->
                <div class="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-[#30324e]" />
                <button
                    v-for="status in props.options"
                    :key="status"
                    type="button"
                    class="relative min-h-8 rounded-sm px-3 py-1 text-[14px] font-medium text-white transition hover:brightness-110"
                    :style="{ backgroundColor: statusColor(status) }"
                    @click="pick(status)"
                >
                    {{ statusLabel(status) }}
                </button>
            </div>
        </template>
    </Teleport>
</template>
