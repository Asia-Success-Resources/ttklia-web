<template>
    <div class="container-xl" v-if="step == 0">
        <div class="row">
            <div class="col-md-8 col-12">
                <!-- Image Carousel -->
                <div v-if="product.images && product.images.length > 1" :id="'productCarousel'" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-indicators">
                        <button v-for="(img, i) in product.images" :key="'ind-'+i" type="button" :data-bs-target="'#productCarousel'" :data-bs-slide-to="i" :class="{ active: i === 0 }"></button>
                    </div>
                    <div class="carousel-inner rounded">
                        <div v-for="(img, i) in product.images" :key="'img-'+i" class="carousel-item" :class="{ active: i === 0 }">
                            <img :src="img" class="d-block w-100" style="height: 400px; object-fit: cover;" :alt="product.name">
                        </div>
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon"></span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
                        <span class="carousel-control-next-icon"></span>
                    </button>
                </div>
                <div class="text-center" v-else-if="product.images && product.images.length === 1">
                    <img :src="product.images[0]" class="w-100 rounded" style="max-width: 500px; object-fit: cover;" :alt="product.name">
                </div>
                <div v-else class="bg-light rounded d-flex align-items-center justify-content-center" style="height: 400px;">
                    <svg-icon name="photo" class="icon-4x text-muted opacity-25" />
                </div>

                <!-- Thumbnails -->
                <div v-if="product.images && product.images.length > 1" class="row g-2 mt-2">
                    <div v-for="(img, i) in product.images" :key="'thumb-'+i" class="col-auto">
                        <img :src="img" class="rounded cursor-pointer border" style="height: 60px; width: 60px; object-fit: cover;"
                            :alt="'Thumbnail ' + (i+1)" @click="goToSlide(i)">
                    </div>
                </div>

                <!-- Description -->
                <div class="mt-4" v-if="product.description">
                    <h5>{{ $t('Description') }}</h5>
                    <hr />
                    <div class="product-description" v-html="product.description"></div>
                </div>
            </div>
            <div class="col-md-4 col-12 my-4 my-md-0">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h4 class="card-title">{{ product.name }}</h4>
                        <h3 class="text-danger fw-bold mt-3">RM {{ parseFloat(product.price).toFixed(2) }}</h3>
                        <hr />
                        <div class="mb-3">
                            <label class="form-label fw-bold">{{ $t('Quantity') }}</label>
                            <div class="input-group">
                                <svg-icon name="circle-minus" class="icon-2x me-2 cursor-pointer text-primary" @click="decrement()" />
                                <input type="text" class="form-control text-center" :value="qty" readonly>
                                <svg-icon name="circle-plus" class="icon-2x ms-2 cursor-pointer text-primary" @click="increment()" />
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="fw-bold">{{ $t('Total Price') }}</span>
                            <span class="fw-bold text-danger fs-5">RM {{ totalPrice.toFixed(2) }}</span>
                        </div>
                        <button class="btn btn-primary text-white w-100 fs-5 mt-3" @click="proceedToCheckout()">{{ $t('Checkout') }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- STEP 1: Details & Payment (same layout as the taxi / car charter / tour checkouts) -->
    <div class="shop-checkout" v-if="step == 1">
        <!-- Order details bar -->
        <div class="sh-trip-bar mb-4">
            <div class="sh-trip-route">
                <div class="sh-trip-point">
                    <span class="sh-trip-label">{{ $t('Product') }}</span>
                    <span class="sh-trip-value">{{ product.name }}</span>
                </div>
            </div>
            <div class="sh-trip-meta">
                <span class="sh-trip-chip"><svg-icon name="shopping-bag" /> {{ qty }} &times; RM {{ money(product.price) }}</span>
                <span class="sh-trip-chip"><svg-icon name="building-store" /> {{ $t('Collect at the counter') }}</span>
                <button type="button" class="sh-trip-edit ms-auto" @click="step = 0"><svg-icon name="pencil" class="me-1" />{{ $t('Change') }}</button>
            </div>
        </div>

        <!-- Stepper -->
        <div class="sh-steps my-4">
            <div v-for="s in steps" :key="s.n"
                 :class="['sh-step', checkoutStep === s.n ? 'active' : '', checkoutStep > s.n ? 'done' : '']"
                 @click="checkoutStep > s.n && (step = 0)">
                <span class="sh-step-num">
                    <svg-icon name="check" v-if="checkoutStep > s.n" />
                    <template v-else>{{ s.n }}</template>
                </span>
                <span class="sh-step-label">{{ s.label }}</span>
            </div>
        </div>

        <h4 class="mb-3">{{ $t('Details & Payment') }}</h4>
        <div class="mb-3">
            <button type="button" class="btn btn-dark" @click="step = 0"><svg-icon name="arrow-left" class="me-1" />{{ $t('Back') }}</button>
        </div>

        <form id="order-form" method="POST" @submit.prevent>
            <div class="row">
                <div class="col-lg-7 mb-4">
                    <section class="panel">
                        <div class="panel__head">
                            <h2 class="panel__title mb-0">{{ $t('Billing Details') }}</h2>
                            <a v-if="!user" href="/register" class="text-link">{{ $t('Sign up for faster bookings!') }}</a>
                        </div>
                        <div class="field-grid field-grid--2">
                            <div class="field field-grid__full">
                                <label for="billing-name" class="field__label">{{ $t('Full Name') }} *</label>
                                <input type="text" id="billing-name" class="form-control" name="billing_name" v-model="billingName" required :placeholder="trans('Full Name')" />
                            </div>
                            <div class="field">
                                <label for="billing-email" class="field__label">{{ $t('Email Address') }} *</label>
                                <input type="email" id="billing-email" name="billing_email" class="form-control" v-model="billingEmail" required :placeholder="trans('Email')" />
                            </div>
                            <div class="field">
                                <label for="phone-num" class="field__label">{{ $t('Phone Number') }} *</label>
                                <input type="hidden" name="billing_phone" :value="billingPhone">
                                <div class="phone-field">
                                    <div class="phone-field__code">
                                        <multi-select :placeholder="trans('Code')"
                                                      v-model="country"
                                                      label="country_name_calling_code"
                                                      track-by="calling_code"
                                                      :options="countriesList"
                                                      :show-labels="false"
                                                      :allow-empty="false">
                                            <template #singleLabel="{ option }"><span>+{{ option.calling_code }}</span></template>
                                            <template #option="{ option }">
                                                <span class="phone-field__option">
                                                    <span class="phone-field__option-name">{{ option.name }}</span>
                                                    <span class="phone-field__option-code">+{{ option.calling_code }}</span>
                                                </span>
                                            </template>
                                        </multi-select>
                                    </div>
                                    <input type="tel" id="phone-num" class="form-control" name="phone_num" v-model="phoneNum" placeholder="123456789" required />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div class="col-lg-5">
                    <div class="card sh-summary-card">
                        <div class="card-body">
                            <h6 class="text-uppercase text-muted mb-3">{{ $t('Order Summary') }}</h6>

                            <!-- selected product -->
                            <div class="sh-sum-vehicle">
                                <div class="sh-sum-vehicle-img">
                                    <img :src="product.images[0]" :alt="product.name" v-if="product.images && product.images.length" />
                                    <svg-icon name="shopping-bag" v-else />
                                </div>
                                <div>
                                    <div class="fw-semibold">{{ product.name }}</div>
                                    <div class="small text-muted">RM {{ money(product.price) }} {{ $t('each') }}</div>
                                </div>
                            </div>

                            <!-- order rows -->
                            <div class="sh-sum-trip">
                                <div class="sh-sum-row">
                                    <svg-icon name="shopping-bag" />
                                    <div>
                                        <span class="sh-sum-label">{{ $t('Quantity') }}</span>
                                        <span class="sh-sum-val">{{ qty }}</span>
                                    </div>
                                </div>
                                <div class="sh-sum-row">
                                    <svg-icon name="qrcode" />
                                    <div>
                                        <span class="sh-sum-label">{{ $t('Collection') }}</span>
                                        <span class="sh-sum-val">{{ $t('Show the QR code on your receipt at the counter') }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- price breakdown -->
                            <div class="sh-sum-prices">
                                <div class="d-flex justify-content-between">
                                    <span class="text-muted">{{ product.name }} &times; {{ qty }}</span>
                                    <span>RM {{ money(totalPrice) }}</span>
                                </div>
                                <div class="d-flex justify-content-between mt-3">
                                    <span class="text-muted">{{ $t('Subtotal') }}</span>
                                    <span>RM {{ money(totalPrice) }}</span>
                                </div>
                            </div>

                            <div class="sh-sum-total">
                                <span>{{ $t('Total') }} (MYR)</span>
                                <span>RM {{ money(totalPrice) }}</span>
                            </div>

                            <div class="sh-sum-points" v-if="user">
                                <span>{{ $t('Your Points') }}</span>
                                <span class="fw-bold" style="color:#1b5e20;">{{ user.points }}</span>
                            </div>

                            <!-- hidden fields -->
                            <input type="hidden" name="product_id" :value="product.id" />
                            <input type="hidden" name="quantity" :value="qty" />
                            <input type="hidden" name="payment" value="1" />

                            <button class="btn btn-success text-white w-100 mt-3" @click="createOrder(true)" v-if="user" type="button" :disabled="loading || user.points < totalPrice">
                                <img v-if="loading && usePoints" src="/images/loading.gif" /><span v-else>{{ $t('Use Points') }}</span>
                            </button>
                            <button class="btn btn-primary text-white w-100 mt-2" @click="createOrder(false)" type="button" :disabled="loading">
                                <img v-if="loading && !usePoints" src="/images/loading.gif" /><span v-else>{{ $t('Make Payment') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>
<script setup>
    import { ref, onMounted, computed, watch } from 'vue';
    import { trans } from "laravel-vue-i18n";

    let props = defineProps({
        product: Object,
        user: Object,
        env: String,
        countries: Array,
    });

    const country = ref({"name":"Malaysia","official_name":"Malaysia","native_name":"Malaysia","native_official_name":"Malaysia","iso_3166_1_alpha2":"MY","iso_3166_1_alpha3":"MYS","calling_code":"60","currency":"MYR","emoji":"🇲🇾","country_name_calling_code":"Malaysia (+60)"});
    const countriesList = ref([]);

    const step = ref(0);
    const qty = ref(1);
    const loading = ref(false);
    const usePoints = ref(false);

    // The checkout stepper mirrors the taxi / car charter flow: the product and
    // quantity are chosen on the product page (step 0), so here that step is done.
    const steps = computed(() => [
        { n: 1, label: trans('Select Product') },
        { n: 2, label: trans('Details & Payment') },
    ]);
    const checkoutStep = computed(() => step.value + 1);

    const money = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    watch(step, (value) => {
        if (value === 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    const billingName = ref(props.user ? props.user.name : '');
    const phoneNum = ref(props.user ? props.user.phone_number : '');
    const billingEmail = ref(props.user ? props.user.email : '');

    onMounted(() => {
        countriesList.value = (props.countries || []).filter(c => c.calling_code).map(c => ({
            ...c,
            country_name_calling_code: `${c.name} (+${c.calling_code})`,
        }));

        if (props?.user?.country_code) {
            country.value = countriesList.value.find(c => '+' + c.calling_code === props.user.country_code);
        }
    });

    const billingPhone = computed(() => {
        if (country.value) {
            return country.value.calling_code + '' + phoneNum.value;
        }
        return phoneNum.value;
    });

    function increment() {
        qty.value++;
    }

    function decrement() {
        if (qty.value > 1) qty.value--;
    }

    const totalPrice = computed(() => {
        return qty.value * parseFloat(props.product.price || 0);
    });

    const proceedToCheckout = () => {
        if (qty.value <= 0) {
            Swal.fire({ icon: "error", title: trans("Error") + '!', text: trans("Select quantity") });
            return;
        }
        step.value = 1;
    };

    const goToSlide = (index) => {
        const carousel = document.querySelector('#productCarousel');
        if (carousel) {
            const bsCarousel = bootstrap.Carousel.getOrCreateInstance(carousel);
            bsCarousel.to(index);
        }
    };

    const createOrder = (points) => {
        if (loading.value) return;
        if (!$("#order-form")[0].checkValidity()) {
            $("#order-form")[0].reportValidity();
            return;
        }
        usePoints.value = points;
        loading.value = true;

        let formData = new FormData($('#order-form')[0]);
        formData.append('use_points', points ? 1 : 0);
        axios.post('/orders', formData).then((response) => {
            let order = response.data.response;
            if (points) {
                window.location.href = '/orders/' + order.code + '/' + order.web_session_id;
                return;
            }
            if (order.payment_url) {
                window.location.replace(order.payment_url);
            } else if (order.payment_params) {
                let req = order.payment_params;
                Swal.fire({
                    icon: "success",
                    title: trans("Success") + '!',
                    text: trans('Order created. Please proceed to make payment.'),
                    timer: 3000,
                }).then(function () {
                    const formData = {
                        TransactionType: 'SALE',
                        PymtMethod: 'ANY',
                        ServiceID: req.service_id,
                        PaymentID: req.payment_id,
                        OrderNumber: req.order_number,
                        PaymentDesc: req.payment_desc,
                        MerchantName: req.merchant_name,
                        MerchantReturnURL: req.return_url,
                        MerchantCallbackURL: req.callback_url,
                        Amount: req.amount,
                        CurrencyCode: req.currency_code,
                        CustName: req.customer_name,
                        CustPhone: req.customer_phone,
                        CustEmail: req.customer_email,
                        HashValue: req.signature,
                        MerchantTermsURL: 'https://ttklia.com/terms',
                        LanguageCode: document.documentElement.lang.toUpperCase(),
                        CustIP: req.ip,
                        PageTimeout: req.page_timeout,
                    };
                    const form = document.createElement('form');
                    form.method = 'post';
                    form.action = props.env === "production"
                        ? 'https://securepay.e-ghl.com/IPG/Payment.aspx'
                        : 'https://pay.e-ghl.com/IPGSG/Payment.aspx';
                    for (const key in formData) {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = formData[key];
                        form.appendChild(input);
                    }
                    document.body.appendChild(form);
                    form.submit();
                    document.body.removeChild(form);
                });
            } else {
                window.location.href = '/orders/' + order.code + '/' + order.web_session_id;
            }
        }).catch(function (error) {
            loading.value = false;
            if (error.response && error.response.data) {
                if (error.response?.status == 401) {
                    Swal.fire({
                        icon: "error",
                        title: trans("Error") + '!',
                        text: trans('Please proceed to login before payment.'),
                        timer: 2000,
                    }).then(function () {
                        window.location.replace('/login');
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: trans("Error") + '!',
                        text: trans(error.response.data.meta.message),
                    });
                }
            }
        });
    };
</script>

<style scoped>
/* Checkout: same look as the taxi (tx-*), car charter (cc-*) and tour (tr-*)
   "Details & Payment" step. */
.sh-trip-bar {
    position: relative;
    overflow: hidden;
    padding: 1.25rem 1.5rem;
    border-radius: 16px;
    color: rgba(255,255,255,.78);
    background:
        radial-gradient(120% 140% at 100% 0%, rgba(217,0,4,.5) 0%, rgba(217,0,4,0) 55%),
        #111827;
}
.sh-trip-route { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.sh-trip-point { display: flex; flex-direction: column; min-width: 0; }
.sh-trip-label { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: rgba(255,255,255,.6); }
.sh-trip-value { font-weight: 700; font-size: 1.1rem; color: #fff; }
.sh-trip-meta { display: flex; align-items: center; gap: .5rem 1rem; flex-wrap: wrap; margin-top: .9rem; padding-top: .9rem; border-top: 1px solid rgba(255,255,255,.14); }
.sh-trip-chip { display: inline-flex; align-items: center; gap: .4rem; font-size: .85rem; color: #fff; }
.sh-trip-chip .svg-icon { color: #FF8A8C; }
.sh-trip-edit { display: inline-flex; align-items: center; min-height: 36px; padding: 0 .9rem; border: 1px solid rgba(255,255,255,.35); border-radius: 999px; background: none; color: #fff; font-size: .85rem; font-weight: 500; text-decoration: none; transition: background .15s, border-color .15s; }
.sh-trip-edit:hover { color: #fff; background: rgba(255,255,255,.12); border-color: #fff; }

/* Stepper */
.sh-steps { display: flex; align-items: center; justify-content: center; gap: 0; max-width: 520px; margin-left: auto; margin-right: auto; }
.sh-step { display: flex; flex-direction: column; align-items: center; gap: .4rem; flex: 1; position: relative; color: var(--bs-primary, #c1121f); font-size: .82rem; }
.sh-step:not(:first-child)::before { content: ''; position: absolute; top: 16px; left: -50%; width: 100%; height: 2px; background: color-mix(in srgb, var(--bs-primary, #c1121f) 30%, #fff); z-index: 0; }
.sh-step.active:not(:first-child)::before,
.sh-step.done:not(:first-child)::before { background: var(--bs-primary, #c1121f); }
.sh-step-num { width: 34px; height: 34px; border-radius: 50%; background: color-mix(in srgb, var(--bs-primary, #c1121f) 15%, #fff); color: var(--bs-primary, #c1121f); display: flex; align-items: center; justify-content: center; font-weight: 600; z-index: 1; transition: .15s; }
.sh-step.active .sh-step-num { background: var(--bs-primary, #c1121f); color: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--bs-primary, #c1121f) 20%, transparent); }
.sh-step.done .sh-step-num { background: var(--bs-primary, #c1121f); color: #fff; cursor: pointer; }
.sh-step-label { color: var(--bs-primary, #c1121f); }
.sh-step.active .sh-step-label, .sh-step.done .sh-step-label { font-weight: 700; }
.sh-step.done { cursor: pointer; }

/* Details card */

/* Phone country-code group - always on one line */

/* Summary card */
.sh-summary-card { border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,.06); position: sticky; top: 1rem; }
.sh-sum-vehicle { display: flex; align-items: center; gap: .8rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
.sh-sum-vehicle-img { flex: 0 0 72px; width: 72px; height: 50px; border-radius: 8px; overflow: hidden; background: #f4f4f4; display: flex; align-items: center; justify-content: center; }
.sh-sum-vehicle-img img { width: 100%; height: 100%; object-fit: cover; }
.sh-sum-vehicle-img .svg-icon { font-size: 1.6rem; color: var(--bs-primary, #c1121f); opacity: .85; }
.sh-sum-trip { padding: 1rem 0; display: flex; flex-direction: column; gap: .85rem; }
.sh-sum-row { display: flex; gap: .7rem; }
.sh-sum-row > .svg-icon { flex: 0 0 18px; margin-top: .15rem; color: var(--bs-primary, #c1121f); font-size: .95rem; text-align: center; }
.sh-sum-label { display: block; font-size: .72rem; text-transform: uppercase; letter-spacing: .03em; color: #aaa; }
.sh-sum-val { display: block; font-weight: 500; color: #2a2a2a; word-break: break-word; }
.sh-sum-prices { padding: 1rem 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
.sh-sum-total { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0 .5rem; font-weight: 700; font-size: 1.35rem; color: var(--bs-primary, #c1121f); }
.sh-sum-points { display: flex; justify-content: space-between; align-items: center; padding: .6rem .85rem; margin-top: 1rem; background: #d9f0e3; border-radius: 10px; font-size: .9rem; }
.btn-success:disabled { background-color: #8b8b8b !important; color: black !important; }

@media (max-width: 575px) {
    .sh-step-label { font-size: .72rem; }
}
</style>
