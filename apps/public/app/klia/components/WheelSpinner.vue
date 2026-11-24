    <template>
        <div class="outer-ring">
            <div class="wheel-wrapper">
            <roulette
                ref="wheel"
                :items="props.items"
                @click="launchWheel"
                @wheel-end="onWheelEnd"
                :display-indicator="false"
                :wheel-result-index="{ value: winnerIndex }"
                :size="wheelSize"
                :result-variation="100"
                :duration="3"
                :easing="'ease'"
                :base-size="baseSize"
                :base-display="true"
                :base-display-indicator="true"
                :base-background="'white'"
            >

                <template #baseContent>
                    <div style="font-size: 14px; text-align:center; font-family:Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif">
                        SPIN ME
                </div>
                </template>
            </roulette>
            </div>
        </div>
    </template>

    <script setup>
    import { onMounted, ref , onBeforeUnmount, nextTick, computed } from 'vue'

    const winnerIndex = ref(0);

    let props = defineProps({
        items: {
            type: Array,
            required: true,
            default: () => []
        },
        user: {
            type: Object,
            required: false,
            default: null
        }
    });

    const wheelSize = ref(400)
    const baseSize = ref(100)

    // Set Wheel Size according to screen
    onMounted(() => {
        updateWheelSize()
        window.addEventListener('resize', updateWheelSize);
        const spinModal = document.getElementById('spinModal');
        if (spinModal) {
            window.bootstrap.Modal.getOrCreateInstance(spinModal).show();
        }
    })

    onBeforeUnmount(() => {
        window.removeEventListener('resize', updateWheelSize)
    })

    function updateWheelSize() {
    const width = window.innerWidth

    if (width <= 425) {
        wheelSize.value = 220
        baseSize.value = 50
    } else if (width <= 767) {
        wheelSize.value = 300
        baseSize.value = 100
    } else {
        wheelSize.value = 400
    }
    }

    const wheel = ref(null);
    const spinning = ref(false);

    // Launch & Reset Wheel Function
    async function launchWheel() {
        if (spinning.value || !wheel.value) return;

        spinning.value = true;

        try {
            const response = await axios.post('/wheel-winner/set');
            const winner = response.data.response ?? "0";
            if (winner) {
                winnerIndex.value = winner;

                await nextTick();

                wheel.value.launchWheel();
            } else {
                spinning.value = false;
                Swal.fire({
                    title: "Error",
                    text: "Opps, We run out of prizes, Try again next time.",
                    icon: "error"
                });
            }
        } catch (error) {
            spinning.value = false;
            console.error(error);
            Swal.fire("Error", "Something went wrong.", "error");
        }
    }

    function onWheelEnd(result) {
        if (result !== null) {
            let message = '.'
            let title, text;

            if (result.type == 'Ticket' ) {
                message = ' at TTKLIA counter.';
            } else if (result.type == 'Discount' ) {
                message = ' is awarded to your account.';
            }

            if (result.prize_amount <= 0) {
                title = "Oh No!";
                text = "You got " + result.name + ". Try again next time";
            } else {
                title = "Congratulations!";
                text = "You have won " + result.name + ". ";
                if (result.type == 'Discount') {
                    text += "Prize" + message;
                } else {
                    if (!props.user) {
                        text += "Sign up to claim your prize" + message;
                    } else {
                        text += "Claim your prize" + message;
                    }
                }
            }

            Swal.fire({
                title: title,
                text: text,
                icon: "success"
            }).then(() => {
                window.location.href = !props.user ? '/register' : '/profiles/rewards';
            });
        } else {
            Swal.fire({
                title: "Error!",
                text: "Something went wrong, try again next time",
                icon: "error"
            }).then(() => {
                if (!props.user) {
                    window.location.href = '/register';
                } else {
                    window.location.reload();
                }
            });
        }
    }



    </script>

    <style scoped>
    ::v-deep(.wheel) {
        border: 3px solid #ab121f !important;
    }

    .wheel-wrapper {
        background-color: #d14343;
        border-radius: 100%;
        padding: 10px;
        display: inline-flex;
    }

    .outer-ring {
        border: 3px solid #ab121f;
        border-radius: 50%;
        padding: 0;
        display: inline-flex;
    }

    /* line between items */
    ::v-deep(.wheel-item) {
        border: none !important;
        border-bottom: 3px solid #f05948 !important;
    }

    ::v-deep(.wheel-base-container) {
        position: absolute;
        z-index: 2;
        top: 50%;
        left: 50%;
        border-radius: 50%;
        border: 5px solid #ab121f !important;
        transform: translate(-50%, -50%);
    }

    ::v-deep(.wheel-base-container .wheel-base-indicator::before) {
        border-bottom: solid 20px #ab121f !important;
        top: -20px !important;
        border-left: 15px solid transparent !important;
        border-right: 15px solid transparent !important;

    }
    </style>
