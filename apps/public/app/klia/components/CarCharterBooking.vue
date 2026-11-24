<template>
    <div class="container py-4">
        <!-- Trip details bar -->
        <div class="cc-trip-bar mb-4">
            <div class="cc-trip-route">
                <div class="cc-trip-point">
                    <span class="cc-trip-label">{{ $t('Pick-up location') }}</span>
                    <span class="cc-trip-value">{{ f.pickup }}</span>
                </div>
            </div>
            <div class="cc-trip-meta">
                <span class="cc-trip-chip"><svg-icon name="clock" /> {{ f.hours }} {{ $t('Hours') }} {{ $t('Package') }}</span>
                <span class="cc-trip-chip"><svg-icon name="calendar" /> {{ f.date }} {{ f.time }}</span>
                <span class="cc-trip-chip"><svg-icon name="users" /> {{ f.pax }} {{ $t('Pax') }}</span>
                <a :href="editUrl" class="cc-trip-edit ms-auto"><svg-icon name="pencil" class="me-1" />{{ $t('Change') }}</a>
            </div>
        </div>

        <!-- Step indicator -->
        <div class="cc-steps my-4">
            <div v-for="s in steps" :key="s.n"
                 :class="['cc-step', step === s.n ? 'active' : '', step > s.n ? 'done' : '']"
                 @click="goTo(s.n)">
                <span class="cc-step-num">
                    <svg-icon name="check" v-if="step > s.n" />
                    <template v-else>{{ s.display }}</template>
                </span>
                <span class="cc-step-label">{{ s.label }}</span>
            </div>
        </div>

        <!-- STEP 1: Select Vehicle -->
        <template v-if="step === 1">
            <h4 class="mb-3">{{ $t('Select Your Vehicle') }}</h4>
            <div class="row g-4">
                <div class="col-sm-6 col-lg-4" v-for="v in vehicles" :key="v.id">
                    <div :class="['cc-car-card', selectedVehicle && selectedVehicle.id === v.id ? 'selected' : '', vehiclePrice(v) === null ? 'unavailable' : '']">
                        <!-- image / carousel -->
                        <div class="cc-car-media">
                            <img :src="vImages(v)[imgIndex[v.id] || 0] || '/images/car-placeholder.png'" :alt="v.name" />
                            <template v-if="vImages(v).length > 1">
                                <button type="button" class="cc-car-nav prev" @click.stop="stepImg(v, -1)">&lsaquo;</button>
                                <button type="button" class="cc-car-nav next" @click.stop="stepImg(v, 1)">&rsaquo;</button>
                                <div class="cc-car-dots">
                                    <span v-for="(img, i) in vImages(v)" :key="i"
                                          :class="['cc-car-dot', (imgIndex[v.id] || 0) === i ? 'active' : '']"
                                          @click.stop="setImg(v, i)"></span>
                                </div>
                            </template>
                        </div>

                        <!-- title + capacity -->
                        <div class="cc-car-head">
                            <h5 class="cc-car-title mb-0">{{ v.name }}</h5>
                            <div class="cc-car-caps">
                                <span class="cc-cap"><svg-icon name="users" /> {{ v.maximum_capacity }}</span>
                                <span class="cc-cap"><svg-icon name="luggage" /> {{ v.luggage_capacity ?? '-' }}</span>
                            </div>
                        </div>

                        <!-- price -->
                        <!-- prices: 8h / 10h -->
                        <div class="cc-car-prices" v-if="priceRange[v.id]">
                            <div class="cc-car-prow" v-if="priceRange[v.id].p8 !== null">
                                <span class="cc-car-plabel">8 {{ $t('Hours') }}</span>
                                <span class="cc-car-plabel">RM {{ money(Number(priceRange[v.id].p8)) }}</span>
                            </div>
                            <div class="cc-car-prow" v-if="priceRange[v.id].p10 !== null">
                                <span class="cc-car-plabel">10 {{ $t('Hours') }}</span>
                                <span class="cc-car-plabel">RM {{ money(Number(priceRange[v.id].p10)) }}</span>
                            </div>
                        </div>

                        <!-- book -->
                        <button type="button" class="cc-car-book" :disabled="vehiclePrice(v) === null" @click.stop="bookVehicle(v)">
                            {{ selectedVehicle && selectedVehicle.id === v.id ? $t('Continue') : $t('Book Now') }}
                        </button>
                    </div>
                </div>
                <div class="col-12" v-if="!vehicles.length">
                    <div class="alert alert-info">{{ $t('No vehicles available for car charter.') }}</div>
                </div>
            </div>
        </template>

        <!-- STEP 2: Add-ons -->
        <template v-if="step === 2">
            <h4 class="mb-3">{{ $t('Add-ons') }}</h4>
            <div class="row g-3 mb-4">
                <div class="col-sm-6 col-lg-4" v-for="a in addons" :key="a.id">
                    <div :class="['cc-addon-card', selectedAddons.includes(a.id) ? 'selected' : '']" @click="toggleAddon(a)">
                        <span class="cc-addon-check"><svg-icon name="check" /></span>
                        <div class="cc-addon-name">{{ a.name }}</div>
                        <small class="cc-addon-remarks" v-if="a.remarks">{{ a.remarks }}</small>
                        <div class="cc-addon-price">RM {{ money(a.price) }}</div>
                    </div>
                </div>
                <div class="col-12" v-if="!addons.length">
                    <div class="alert alert-info mb-0">{{ $t('No add-ons available.') }}</div>
                </div>
            </div>
            <div class="d-flex justify-content-between">
                <button class="btn btn-dark" @click="step = 1">{{ $t('Back') }}</button>
                <button class="btn btn-primary text-white" @click="goToDetails">{{ $t('Next') }}</button>
            </div>
        </template>

        <!-- STEP 3: Customer details + pay -->
        <template v-if="step === 3">
            <div class="row">
                <div class="col-lg-7 mb-4">
                    <section class="panel">
                        <div class="panel__head">
                            <h2 class="panel__title mb-0">{{ $t('Contact Details') }}</h2>
                        </div>
                        <div class="field-grid field-grid--2">
                            <div class="field field-grid__full">
                                <label for="cc-name" class="field__label">{{ $t('Name') }}</label>
                                <input type="text" id="cc-name" class="form-control" v-model="form.customer_name" />
                            </div>
                            <div class="field">
                                <label for="cc-email" class="field__label">{{ $t('Email') }}</label>
                                <input type="email" id="cc-email" class="form-control" v-model="form.customer_email" />
                            </div>
                            <div class="field">
                                <label for="cc-phone" class="field__label">{{ $t('Phone') }}</label>
                                <div class="phone-field">
                                    <div class="phone-field__code">
                                        <multi-select :placeholder="$t('Code')"
                                                      v-model="country"
                                                      label="country_name_calling_code"
                                                      track-by="calling_code"
                                                      :options="countryOptions"
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
                                    <input type="tel" id="cc-phone" class="form-control" v-model="form.customer_phone" placeholder="123456789" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- How it works -->
                    <section class="panel mt-3" aria-labelledby="cc-how-title">
                        <h2 class="panel__title" id="cc-how-title">{{ $t('How it works') }}</h2>
                        <ol class="cc-how">
                            <li><span class="cc-how-num">1</span><span class="cc-how-text">{{ $t('Book and pay') }}</span></li>
                            <li><span class="cc-how-num">2</span><span class="cc-how-text">{{ $t('Our support team confirms your itinerary and car & driver details') }}</span></li>
                            <li><span class="cc-how-num">3</span><span class="cc-how-text">{{ $t('Your driver is arranged one day before your trip') }}</span></li>
                            <li><span class="cc-how-num">4</span><span class="cc-how-text">{{ $t('On the day, your driver picks you up on time at the agreed point') }}</span></li>
                            <li><span class="cc-how-num">5</span><span class="cc-how-text">{{ $t('Start your trip and enjoy free itinerary changes within scope') }}</span></li>
                        </ol>
                        <ul class="cc-perks">
                            <li><svg-icon name="user-shield" /><span>{{ $t('Professional local drivers') }}</span></li>
                            <li><svg-icon name="route" /><span>{{ $t('Flexible and adjustable itinerary') }}</span></li>
                            <li><svg-icon name="headset" /><span>{{ $t('24/7 customer support') }}</span></li>
                        </ul>
                    </section>
                </div>
                <div class="col-lg-5">
                    <div class="card cc-summary-card">
                        <div class="card-body">
                            <h6 class="text-uppercase text-muted mb-3">{{ $t('Booking Summary') }}</h6>

                            <!-- selected vehicle -->
                            <div class="cc-sum-vehicle" v-if="selectedVehicle">
                                <div class="cc-sum-vehicle-img">
                                    <img :src="vImages(selectedVehicle)[0] || '/images/car-placeholder.png'" :alt="selectedVehicle.name" />
                                </div>
                                <div>
                                    <div class="fw-semibold">{{ selectedVehicle.name }}</div>
                                    <div class="small text-muted">{{ f.hours }} {{ $t('Hours') }} {{ $t('Package') }}</div>
                                </div>
                                <button type="button" class="cc-sum-change ms-auto" @click="goTo(1)"><svg-icon name="pencil" class="me-1" />{{ $t('Change') }}</button>
                            </div>

                            <!-- trip rows -->
                            <div class="cc-sum-trip">
                                <div class="cc-sum-row">
                                    <svg-icon name="map-pin" />
                                    <div>
                                        <span class="cc-sum-label">{{ $t('Pick-up location') }}</span>
                                        <span class="cc-sum-val">{{ f.pickup }}</span>
                                    </div>
                                </div>
                                <div class="cc-sum-row">
                                    <svg-icon name="calendar" />
                                    <div>
                                        <span class="cc-sum-label">{{ $t('Pick-up Date & Time') }}</span>
                                        <span class="cc-sum-val">{{ f.date }} {{ f.time }}</span>
                                    </div>
                                </div>
                                <div class="cc-sum-row" v-if="endDateTime">
                                    <svg-icon name="clock" />
                                    <div>
                                        <span class="cc-sum-label">{{ $t('Booking Until') }}</span>
                                        <span class="cc-sum-val">{{ endDateTime }} ({{ f.hours }} {{ $t('Hours') }})</span>
                                    </div>
                                </div>
                                <div class="cc-sum-row">
                                    <svg-icon name="users" />
                                    <div>
                                        <span class="cc-sum-label">{{ $t('Pax') }}</span>
                                        <span class="cc-sum-val">{{ f.pax }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- price breakdown -->
                            <div class="cc-sum-prices">
                                <div class="d-flex justify-content-between">
                                    <span class="text-muted">{{ $t('Base Fare') }}</span>
                                    <span>RM {{ money(basePrice) }}</span>
                                </div>
                                <template v-if="selectedAddonList.length">
                                    <div class="text-muted small text-uppercase mt-3 mb-1" style="letter-spacing:.03em;">{{ $t('Add-ons') }}</div>
                                    <div class="d-flex justify-content-between mt-1" v-for="a in selectedAddonList" :key="a.id">
                                        <span><svg-icon name="plus" class="text-primary me-1" style="font-size:.7rem;" />{{ a.name }}</span>
                                        <span>RM {{ money(a.price) }}</span>
                                    </div>
                                </template>
                                <div class="d-flex justify-content-between mt-3">
                                    <span class="text-muted">{{ $t('Subtotal') }}</span>
                                    <span>RM {{ money(subtotal) }}</span>
                                </div>
                                <div class="d-flex justify-content-between mt-1" v-if="sstAmount > 0">
                                    <span class="text-muted">{{ $t('SST') }} ({{ sstPercentage }}%)</span>
                                    <span>RM {{ money(sstAmount) }}</span>
                                </div>
                            </div>

                            <div class="cc-sum-total">
                                <span>{{ $t('Total') }}</span>
                                <span>RM {{ money(totalPrice) }}</span>
                            </div>

                            <div class="cc-sum-points" v-if="user">
                                <span>{{ $t('Your Points') }}</span>
                                <span class="fw-bold" style="color:#1b5e20;">{{ money(user.points) }}</span>
                            </div>

                            <button v-if="user"
                                    class="btn btn-success text-white w-100 mt-3"
                                    :disabled="loading || !canPay || user.points < totalPrice"
                                    @click="submit(true)">
                                {{ loading && usePoints ? $t('Processing...') : $t('Use Points') }}
                            </button>

                            <button class="btn btn-primary text-white w-100 mt-2" :disabled="loading || !canPay" @click="submit(false)">
                                {{ loading && !usePoints ? $t('Processing...') : $t('Make Payment') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    props: {
        vehicles: { type: Array, default: () => [] },
        addons: { type: Array, default: () => [] },
        pickup: { type: String, default: '' },
        date: { type: String, default: '' },
        time: { type: String, default: '' },
        hours: { type: [Number, String], default: 8 },
        pax: { type: [Number, String], default: 1 },
        user: { type: Object, default: null },
        countries: { type: Array, default: () => [] },
    },
    data() {
        return {
            step: 1,
            country: null,
            countryOptions: [],
            f: {
                hours: Number(this.hours) || 8,
                date: this.date || '',
                time: this.time || '',
                pickup: this.pickup || '',
                pax: Number(this.pax) || 1,
            },
            prices: {},            // vehicle_type_id -> base price for current type/hours
            priceRange: {},        // vehicle_type_id -> { p8, p10 }
            imgIndex: {},          // vehicle_type_id -> current carousel image index
            selectedVehicle: null,
            selectedAddons: [],
            basePrice: 0,
            addonPrice: 0,
            subtotal: 0,
            sstPercentage: 0,
            sstAmount: 0,
            totalPrice: 0,
            loading: false,
            usePoints: false,
            form: {
                customer_name: this.user?.name ?? '',
                customer_phone: this.user?.phone_number ?? '',
                customer_email: this.user?.email ?? '',
            },
        };
    },
    computed: {
        editUrl() {
            // back to home banner with current selection prefilled
            const p = new URLSearchParams({
                pickup_location: this.f.pickup,
                date: this.f.date,
                time: this.f.time,
                hours: this.f.hours,
                pax: this.f.pax,
            });
            return '/?' + p.toString() + '#car-charter';
        },
        canPay() {
            return this.form.customer_name && this.form.customer_phone && this.selectedVehicle;
        },
        hasAddons() {
            return this.addons.length > 0;
        },
        steps() {
            const all = [
                { n: 1, label: this.$t('Select Vehicle') },
                { n: 2, label: this.$t('Add-ons') },
                { n: 3, label: this.$t('Details & Payment') },
            ];
            const visible = this.hasAddons ? all : all.filter(s => s.n !== 2);
            // renumber display so no gap when Add-ons hidden
            return visible.map((s, i) => ({ ...s, display: i + 1 }));
        },
        selectedAddonList() {
            return this.addons.filter(a => this.selectedAddons.includes(a.id));
        },
        endDateTime() {
            const tm = /^(\d{1,2}):(\d{2})/.exec(this.f.time || '');
            if (!tm || !this.f.date) return '';
            const d = new Date(`${this.f.date}T00:00:00`);
            if (isNaN(d)) return '';
            const hours = Number(this.f.hours) || 0;
            d.setHours(Number(tm[1]), Number(tm[2]) + hours * 60, 0, 0);
            const y = d.getFullYear();
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            return `${y}-${mo}-${dd} ${hh}:${mm}`;
        },
        fullPhone() {
            const p = (this.form.customer_phone || '').replace(/^0+/, '');
            if (this.country?.calling_code && p) {
                return this.country.calling_code + '' + p;
            }
            return p;
        },
    },
    mounted() {
        this.loadVehiclePrices();
        this.countryOptions = (this.countries || []).filter(c => c.calling_code).map(c => ({
            ...c,
            country_name_calling_code: `${c.name} (+${c.calling_code})`,
        }));
        if (this.user?.country_code) {
            this.country = this.countryOptions.find(c => '+' + c.calling_code === this.user.country_code) || null;
        }
        if (!this.country) {
            this.country = this.countryOptions.find(c => c.calling_code === '60') || this.countryOptions[0] || null;
        }
    },
    methods: {
        money(v) {
            return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
        goTo(target) {
            if (target < this.step) this.step = target;
        },
        vImages(v) {
            const imgs = Array.isArray(v.images) && v.images.length ? v.images : [v.image];
            return imgs.filter(Boolean);
        },
        setImg(v, i) {
            this.imgIndex = { ...this.imgIndex, [v.id]: i };
        },
        stepImg(v, dir) {
            const len = this.vImages(v).length;
            if (len < 2) return;
            const cur = this.imgIndex[v.id] || 0;
            this.setImg(v, (cur + dir + len) % len);
        },
        bookVehicle(v) {
            if (this.vehiclePrice(v) === null) return;
            this.selectVehicle(v);
            this.goToAddons();
        },
        toggleAddon(a) {
            const i = this.selectedAddons.indexOf(a.id);
            if (i === -1) this.selectedAddons.push(a.id);
            else this.selectedAddons.splice(i, 1);
            this.recalc();
        },
        vehiclePrice(v) {
            const p = this.prices[v.id];
            return p === undefined ? null : p;
        },
        loadVehiclePrices() {
            // One batched request for all vehicles (backend whereIn) — no parallel
            // races to reconcile.
            return axios.get('/car-charter/price', {
                params: {
                    hours: this.f.hours,
                    vehicle_type_ids: this.vehicles.map((v) => v.id),
                },
            }).then(({ data }) => {
                const r = data.response ?? data;
                const prices = {};
                const ranges = {};
                this.vehicles.forEach((v) => {
                    const row = r[v.id] ?? null;
                    prices[v.id] = row ? row.base_price : null;
                    ranges[v.id] = row ? { p8: row.price_8h, p10: row.price_10h } : null;
                });
                this.prices = prices;
                this.priceRange = ranges;
            }).catch(() => {
                const prices = {};
                const ranges = {};
                this.vehicles.forEach((v) => { prices[v.id] = null; ranges[v.id] = null; });
                this.prices = prices;
                this.priceRange = ranges;
            });
        },
        selectVehicle(v) {
            this.selectedVehicle = v;
        },
        goToAddons() {
            this.recalc();
            this.step = this.hasAddons ? 2 : 3;
        },
        goToDetails() {
            this.recalc();
            this.step = 3;
        },
        recalc() {
            if (!this.selectedVehicle) return;
            axios.get('/car-charter/price', {
                params: {
                    vehicle_type_id: this.selectedVehicle.id,
                    hours: this.f.hours,
                    addon_ids: this.selectedAddons,
                },
            }).then(({ data }) => {
                const r = data.response ?? data;
                this.basePrice = r.base_price;
                this.addonPrice = r.addon_price;
                this.subtotal = r.subtotal;
                this.sstPercentage = r.sst_percentage;
                this.sstAmount = r.sst_amount;
                this.totalPrice = r.total_price;
            }).catch(() => {});
        },
        submit(withPoints = false) {
            this.usePoints = withPoints;
            this.loading = true;
            axios.post('/car-charter/book', {
                vehicle_type_id: this.selectedVehicle.id,
                date: this.f.date,
                time: this.f.time,
                hours: this.f.hours,
                pickup_location: this.f.pickup,
                pax: this.f.pax,
                addon_ids: this.selectedAddons,
                customer_name: this.form.customer_name,
                customer_phone: this.fullPhone,
                customer_email: this.form.customer_email,
                use_points: withPoints ? 1 : 0,
                payment: withPoints ? 0 : 1,
            }).then(({ data }) => {
                const r = data.response ?? data;
                if (r.payment_url) {
                    window.location.href = r.payment_url;
                } else if (r.code) {
                    window.location.href = `/car-charter/${r.code}/${r.web_session_id}`;
                }
            }).catch((e) => {
                this.loading = false;
                alert(e.response?.data?.meta?.message || 'Booking failed. Please try again.');
            });
        },
    },
};
</script>

<style scoped>
/* Trip bar: dark banner matching the site's page headers */
.cc-trip-bar {
    position: relative;
    overflow: hidden;
    padding: 1.25rem 1.5rem;
    border-radius: 16px;
    color: rgba(255,255,255,.78);
    background:
        radial-gradient(120% 140% at 100% 0%, rgba(217,0,4,.5) 0%, rgba(217,0,4,0) 55%),
        #111827;
}
.cc-trip-route { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.cc-trip-point { display: flex; flex-direction: column; min-width: 0; }
.cc-trip-label { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: rgba(255,255,255,.6); }
.cc-trip-value { font-weight: 700; font-size: 1.1rem; color: #fff; }
.cc-trip-meta { display: flex; align-items: center; gap: .5rem 1rem; flex-wrap: wrap; margin-top: .9rem; padding-top: .9rem; border-top: 1px solid rgba(255,255,255,.14); }
.cc-trip-chip { display: inline-flex; align-items: center; gap: .4rem; font-size: .85rem; color: #fff; }
.cc-trip-chip .svg-icon { color: #FF8A8C; }
.cc-trip-edit { display: inline-flex; align-items: center; min-height: 36px; padding: 0 .9rem; border: 1px solid rgba(255,255,255,.35); border-radius: 999px; color: #fff; font-size: .85rem; font-weight: 500; text-decoration: none; transition: background .15s, border-color .15s; }
.cc-trip-edit:hover { color: #fff; background: rgba(255,255,255,.12); border-color: #fff; }

/* Stepper */
.cc-steps { display: flex; align-items: center; justify-content: center; gap: 0; max-width: 640px; margin-left: auto; margin-right: auto; }
.cc-step { display: flex; flex-direction: column; align-items: center; gap: .4rem; flex: 1; position: relative; color: var(--bs-primary, #c1121f); font-size: .82rem; }
.cc-step:not(:first-child)::before { content: ''; position: absolute; top: 16px; left: -50%; width: 100%; height: 2px; background: color-mix(in srgb, var(--bs-primary, #c1121f) 30%, #fff); z-index: 0; }
.cc-step.active:not(:first-child)::before,
.cc-step.done:not(:first-child)::before { background: var(--bs-primary, #c1121f); }
.cc-step-num { width: 34px; height: 34px; border-radius: 50%; background: color-mix(in srgb, var(--bs-primary, #c1121f) 15%, #fff); color: var(--bs-primary, #c1121f); display: flex; align-items: center; justify-content: center; font-weight: 600; z-index: 1; transition: .15s; }
.cc-step.active .cc-step-num { background: var(--bs-primary, #c1121f); color: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--bs-primary, #c1121f) 20%, transparent); }
.cc-step.done .cc-step-num { background: var(--bs-primary, #c1121f); color: #fff; cursor: pointer; }
.cc-step-label { color: var(--bs-primary, #c1121f); }
.cc-step.active .cc-step-label, .cc-step.done .cc-step-label { font-weight: 700; }
.cc-step.done { cursor: pointer; }

/* Vehicle card */
.cc-car-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 12px; height: 100%; display: flex; flex-direction: column; transition: border-color .15s, box-shadow .15s, transform .2s; }
.cc-car-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(17,24,39,.10), 0 2px 6px rgba(17,24,39,.06); }
.cc-car-card.selected { border-color: var(--bs-primary, #c1121f); box-shadow: 0 0 0 3px color-mix(in srgb, var(--bs-primary, #c1121f) 15%, transparent); }
.cc-car-card.unavailable { opacity: .6; }

.cc-car-media { position: relative; background: #F5F6F8; border-radius: 12px; overflow: hidden; aspect-ratio: 16 / 10; display: flex; align-items: center; justify-content: center; }
.cc-car-media img { width: 100%; height: 100%; object-fit: contain; padding: 8px 30px; }
.cc-car-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; border: none; border-radius: 50%; background: rgba(120,120,120,.55); color: #fff; font-size: 1.4rem; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
.cc-car-nav:hover { background: rgba(80,80,80,.8); }
.cc-car-nav.prev { left: 8px; }
.cc-car-nav.next { right: 8px; }
.cc-car-dots { position: absolute; bottom: 10px; left: 0; right: 0; display: flex; justify-content: center; gap: 6px; }
.cc-car-dot { width: 8px; height: 8px; border-radius: 50%; background: #ccc; cursor: pointer; transition: background .15s; }
.cc-car-dot.active { background: var(--bs-primary, #c1121f); }

.cc-car-head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-top: 14px; }
.cc-car-title { font-size: 1.1rem; font-weight: 700; color: #111827; }
.cc-car-caps { display: flex; gap: .4rem; flex: 0 0 auto; }
.cc-cap { display: inline-flex; align-items: center; gap: .3rem; font-size: .85rem; font-weight: 500; color: #374151; }
.cc-cap .svg-icon { color: var(--bs-primary, #c1121f); }

.cc-car-price { margin-top: 8px; font-size: 1.05rem; font-weight: 700; color: var(--bs-primary, #198754); }
.cc-car-price small { color: #999; font-weight: 400; }
.cc-car-price.cc-na { color: #aaa; font-weight: 500; }

.cc-car-prices { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
.cc-car-prow { display: flex; justify-content: space-between; align-items: baseline; font-size: .95rem; }
.cc-car-plabel { color: #777; font-weight: 500; }
.cc-car-pval { font-weight: 700; color: var(--bs-primary, #198754); }
.cc-car-book { margin-top: 12px; width: 100%; border: none; border-radius: 8px; background: var(--bs-primary, #c1121f); color: #fff; font-weight: 700; letter-spacing: .03em; padding: .7rem 1rem; cursor: pointer; transition: filter .15s; }
.cc-car-book:hover:not(:disabled) { filter: brightness(.92); }
.cc-car-book:disabled { background: #bbb; cursor: not-allowed; }

/* Add-on card */
.cc-addon-card { position: relative; height: 100%; background: #fff; border: 2px solid #eee; border-radius: 14px; padding: 1rem 1.1rem; cursor: pointer; transition: border-color .15s, box-shadow .15s, transform .1s; }
.cc-addon-card:hover { border-color: color-mix(in srgb, var(--bs-primary, #c1121f) 40%, #fff); transform: translateY(-1px); }
.cc-addon-card.selected { border-color: var(--bs-primary, #c1121f); box-shadow: 0 4px 16px color-mix(in srgb, var(--bs-primary, #c1121f) 15%, transparent); }
.cc-addon-check { position: absolute; top: .75rem; right: .75rem; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #ddd; display: flex; align-items: center; justify-content: center; color: transparent; font-size: .75rem; transition: .15s; }
.cc-addon-card.selected .cc-addon-check { background: var(--bs-primary, #c1121f); border-color: var(--bs-primary, #c1121f); color: #fff; }
.cc-addon-name { font-weight: 600; color: #1a2a3a; padding-right: 2rem; }
.cc-addon-remarks { display: block; color: #888; margin-top: .15rem; }
.cc-addon-price { margin-top: .6rem; font-weight: 700; color: var(--bs-primary, #c1121f); }

/* Phone country-code group */

/* Summary card */
.cc-summary-card { border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,.06); position: sticky; top: 1rem; }
.cc-sum-vehicle { display: flex; align-items: center; gap: .8rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
.cc-sum-vehicle-img { flex: 0 0 72px; width: 72px; height: 50px; border-radius: 8px; overflow: hidden; background: #f4f4f4; }
.cc-sum-change { display: inline-flex; align-items: center; flex: 0 0 auto; align-self: flex-start; padding: .3rem .75rem; border: 1px solid #E5E7EB; border-radius: 999px; background: #fff; color: #374151; font-size: .8rem; font-weight: 500; transition: border-color .15s, color .15s; }
.cc-sum-change:hover { border-color: var(--bs-primary, #c1121f); color: var(--bs-primary, #c1121f); }
.cc-sum-vehicle-img img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
.cc-sum-trip { padding: 1rem 0; display: flex; flex-direction: column; gap: .85rem; }
.cc-sum-row { display: flex; gap: .7rem; }
.cc-sum-row > .svg-icon { flex: 0 0 18px; margin-top: .15rem; color: var(--bs-primary, #c1121f); font-size: .95rem; text-align: center; }
.cc-sum-label { display: block; font-size: .72rem; text-transform: uppercase; letter-spacing: .03em; color: #aaa; }
.cc-sum-val { display: block; font-weight: 500; color: #2a2a2a; word-break: break-word; }
.cc-sum-prices { padding: 1rem 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
.cc-sum-total { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0 .5rem; font-weight: 700; font-size: 1.35rem; color: var(--bs-primary, #c1121f); }
.cc-sum-points { display: flex; justify-content: space-between; align-items: center; padding: .6rem .85rem; background: #d9f0e3; border-radius: 10px; font-size: .9rem; }

@media (max-width: 575px) {
    .cc-step-label { font-size: .72rem; }
}

/* How-it-works: numbered steps as a vertical timeline, perks as a centred footer strip */
.cc-how { display: grid; gap: 1.1rem; margin: 0; padding: 0; list-style: none; }
.cc-how li { position: relative; display: flex; align-items: flex-start; gap: .85rem; font-size: .9rem; color: #374151; line-height: 1.45; }
.cc-how li:not(:last-child)::before { content: ''; position: absolute; left: 15px; top: 34px; bottom: calc(-1.1rem + 2px); width: 2px; border-radius: 2px; background: #F5D0D0; }
.cc-how-num { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 32px; width: 32px; height: 32px; border: 2px solid #B30003; border-radius: 50%; background: #fff; color: #B30003; font-size: .85rem; font-weight: 700; }
.cc-how-text { padding-top: .35rem; }
.cc-perks { display: flex; flex-wrap: wrap; justify-content: center; gap: .6rem 1.75rem; margin: 1.5rem 0 0; padding: 1.1rem 0 0; border-top: 1px solid #EEF0F3; list-style: none; }
.cc-perks li { display: inline-flex; align-items: center; gap: .45rem; font-size: .85rem; color: #4B5563; }
.cc-perks .svg-icon { color: var(--bs-primary, #c1121f); }

.cc-notice { display: flex; gap: .7rem; margin-top: 1.1rem; padding: .9rem 1rem; background: #fff8f0; border: 1px solid #ffe0c2; border-radius: 12px; }
.cc-notice > .svg-icon { color: #d98324; margin-top: .15rem; }
.cc-notice strong { display: block; margin-bottom: .35rem; color: #333; font-size: .85rem; text-transform: uppercase; letter-spacing: .03em; }
.cc-notice ul { padding-left: 1.1rem; }
.cc-notice li { font-size: .85rem; color: #555; line-height: 1.5; }
</style>
