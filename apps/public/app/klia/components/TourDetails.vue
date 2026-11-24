<template>
    <!-- STEP 0: Tour page (gallery, description, booking panel) -->
    <div class="tour" v-if="step == 0">
        <a href="/tours" class="back-link"><svg-icon name="arrow-left" /> {{ $t('All tours') }}</a>

        <!-- Gallery -->
        <div class="tour-gallery" :class="{ 'tour-gallery--single': !sideImages.length }" v-if="tour.main_image">
            <button type="button" class="tour-gallery__main" @click="openGallery(0)">
                <img :src="tour.main_image" :alt="tour.name" />
            </button>
            <div class="tour-gallery__side" v-if="sideImages.length">
                <button type="button" class="tour-gallery__thumb" v-for="(image, index) in sideImages" :key="'side-' + index" @click="openGallery(index + 1)">
                    <img :src="image" alt="" loading="lazy" />
                </button>
            </div>
            <button type="button" class="tour-gallery__all" @click="openGallery(0)" v-if="allImages.length > 1">
                <svg-icon name="photo" /> {{ $t('View all photos') }} ({{ allImages.length }})
            </button>
        </div>

        <!-- Title, meta and price -->
        <header class="tour-head">
            <div class="tour-head__copy">
                <span class="tour-head__kicker"><svg-icon name="compass" /> {{ $t('Tour package') }}</span>
                <h1 class="tour-head__title">{{ tour.name }}</h1>
                <ul class="tour-head__meta">
                    <li v-if="tour.end_date"><svg-icon name="calendar" /> {{ $t('Available until') }} {{ formatDate(tour.end_date) }}</li>
                    <li v-if="hasSchedules && routeOptions.length === 1"><svg-icon name="route" /> {{ routeOptions[0].origin }} &rarr; {{ routeOptions[0].destination }}</li>
                    <li v-else-if="hasSchedules && routeOptions.length > 1"><svg-icon name="route" /> {{ routeOptions.length }} {{ $t('routes') }}</li>
                    <li v-if="hasSchedules && tour.trip_type_text"><svg-icon name="arrows-exchange" /> {{ $t(tour.trip_type_text) }}</li>
                    <li v-if="!hasSchedules && tour.max_days > 1"><svg-icon name="clock" /> {{ tour.min_days }}&ndash;{{ tour.max_days }} {{ $t('days') }}</li>
                </ul>
            </div>
            <div class="tour-head__price" v-if="tour.lowest_price != null">
                <span>{{ $t('from') }}</span>
                <strong>RM {{ money(tour.lowest_price) }}</strong>
                <small>{{ $t('per person') }}</small>
            </div>
        </header>

        <div class="tour-layout">
            <div class="tour-layout__main">
                <!-- Description -->
                <section class="panel" aria-labelledby="about-title" v-if="tour.description">
                    <h2 class="panel__title" id="about-title">{{ $t('About this tour') }}</h2>
                    <div class="tour-desc" :class="{ 'tour-desc--clamped': isTruncated && !showFull }" ref="descBox">{{ tour.description }}</div>
                    <button type="button" class="tour-desc__toggle" v-if="isTruncated" @click="showFull = !showFull">
                        {{ showFull ? $t('Show less') : $t('Read more') }}
                        <svg-icon :name="showFull ? 'chevron-down' : 'chevron-right'" />
                    </button>
                </section>

                <!-- Good to know -->
                <section class="panel" aria-labelledby="know-title">
                    <h2 class="panel__title" id="know-title">{{ $t('Good to know') }}</h2>
                    <ul class="tour-facts">
                        <li><svg-icon name="circle-check" /><span>{{ $t('Instant online confirmation') }}</span></li>
                        <li><svg-icon name="credit-card" /><span>{{ $t('Secure online payment') }}</span></li>
                        <li><svg-icon name="device-mobile" /><span>{{ $t('Show your receipt on your phone, no printing needed') }}</span></li>
                        <li><svg-icon name="headset" /><span>{{ $t('Support before and during your trip') }}</span></li>
                    </ul>
                </section>

                <!-- How it works -->
                <section class="panel" aria-labelledby="how-title">
                    <h2 class="panel__title" id="how-title">{{ $t('How it works') }}</h2>
                    <ol class="tour-how">
                        <li><span class="tour-how__num">1</span><div><strong>{{ $t('Pick your date and tickets') }}</strong><span>{{ $t('Choose a departure and how many people are travelling.') }}</span></div></li>
                        <li><span class="tour-how__num">2</span><div><strong>{{ $t('Enter your details and pay') }}</strong><span>{{ $t('Pay securely online or redeem your TTKLIA points.') }}</span></div></li>
                        <li><span class="tour-how__num">3</span><div><strong>{{ $t('Get your confirmation') }}</strong><span>{{ $t('Your receipt is ready right away in your account.') }}</span></div></li>
                    </ol>
                </section>
            </div>

            <!-- Booking panel -->
            <aside class="tour-layout__aside">
                <div class="panel tour-book">
                    <div class="tour-book__head">
                        <h2 class="panel__title">{{ $t('Book this tour') }}</h2>
                        <span class="tour-book__from" v-if="tour.lowest_price != null">{{ $t('from') }} <strong>RM {{ money(tour.lowest_price) }}</strong></span>
                    </div>

                    <!-- Package options: the tour's sellable variants. -->
                    <div class="tour-field" v-if="packages.length">
                        <label class="form-label">{{ $t('Package') }}</label>
                        <div class="tour-packages">
                            <button v-for="option in packages" :key="option.id" type="button"
                                    class="tour-package"
                                    :class="{ 'tour-package--active': selectedPackage?.id === option.id, 'tour-package--out': option.is_sold_out }"
                                    :disabled="option.is_sold_out"
                                    @click="selectPackage(option)">
                                <span class="tour-package__badge" v-if="option.badge">{{ option.badge }}</span>
                                <span class="tour-package__name">
                                    <span class="tour-package__code" v-if="option.code">{{ option.code }} :</span>
                                    {{ option.name }}
                                </span>
                                <span class="tour-package__price" v-if="option.effective_adult_price != null">
                                    <s v-if="option.original_adult_price != null">RM {{ money(option.original_adult_price) }}</s>
                                    RM {{ money(option.effective_adult_price) }}
                                </span>
                                <span class="tour-package__out" v-if="option.is_sold_out">{{ $t('Sold out') }}</span>
                            </button>
                        </div>
                        <p class="tour-package__desc" v-if="selectedPackage?.description">{{ selectedPackage.description }}</p>
                    </div>

                    <!-- Date (tours without schedules) -->
                    <div class="tour-field" v-if="!hasSchedules">
                        <label for="date" class="form-label">{{ $t('Date') }}</label>
                        <VueDatePicker
                            v-model="date"
                            auto-apply
                            :enable-time-picker="false"
                            :format="formatDate"
                            :min-date="minDate"
                            :max-date="maxDate"
                            :min-range="minDays"
                            :max-range="maxDays"
                            :placeholder="trans('Select Date')"
                            name="date"
                        />
                    </div>

                    <!-- Route -> Date -> Time (scheduled tours) -->
                    <template v-else>
                        <div class="tour-field">
                            <label for="route" class="form-label">{{ $t('Route') }}</label>
                            <select id="route" class="form-select" v-model="route">
                                <option :value="null">{{ $t('Select Route') }}</option>
                                <option v-for="option in routeOptions" :key="option.key" :value="option.key">
                                    {{ option.origin }} &rarr; {{ option.destination }}
                                </option>
                            </select>
                            <small v-if="routeOptions.length === 0" class="tour-field__error">
                                {{ $t('No departures are currently available for this tour.') }}
                            </small>
                        </div>

                        <div class="tour-field" v-if="route">
                            <label for="departure_date" class="form-label">{{ $t('Date') }}</label>
                            <select id="departure_date" class="form-select" v-model="departureDate">
                                <option :value="null">{{ $t('Select Date') }}</option>
                                <option v-for="option in dateOptions" :key="option" :value="option">
                                    {{ option }}
                                </option>
                            </select>
                        </div>

                        <div class="tour-field" v-if="route && departureDate">
                            <label for="tour_schedule_id" class="form-label">{{ $t('Time') }}</label>
                            <select id="tour_schedule_id" class="form-select" v-model="schedule">
                                <option :value="null">{{ $t('Select Time') }}</option>
                                <option v-for="option in timeOptions" :key="option.id" :value="option">
                                    {{ option.time_text }}
                                    <template v-if="option.available_seats != null"> &middot; {{ option.available_seats }} {{ $t('seats left') }}</template>
                                </option>
                            </select>
                        </div>

                        <div class="tour-field" v-if="offersReturn">
                            <div v-if="requiresReturn" class="tour-note">
                                <svg-icon name="info-circle" />
                                <span>{{ $t('This tour is sold as a return trip. Please select your return departure.') }}</span>
                            </div>
                            <div v-else class="form-check form-switch tour-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="is_return" v-model="isReturn" @change="onReturnToggle">
                                <label class="form-check-label" for="is_return">{{ $t('Return trip') }}</label>
                            </div>
                        </div>

                        <div class="tour-field" v-if="offersReturn && isReturn">
                            <label for="return_tour_schedule_id" class="form-label">{{ $t('Return Time') }}</label>
                            <select id="return_tour_schedule_id" class="form-select" v-model="returnSchedule">
                                <option :value="null">{{ $t('Select Return Time') }}</option>
                                <option v-for="option in returnOptions" :key="option.id" :value="option">
                                    {{ option.time_text }}
                                </option>
                            </select>
                            <small v-if="returnOptions.length > 0" class="tour-field__hint">
                                {{ returnOptions[0].origin }} &rarr; {{ returnOptions[0].destination }}, {{ schedule?.date_text }}
                            </small>
                            <small v-if="returnOptions.length === 0" class="tour-field__error">
                                {{ $t('No return departure is available after the selected departure.') }}
                            </small>
                        </div>
                    </template>

                    <!-- Tickets -->
                    <div class="tour-tickets">
                        <span class="form-label">{{ $t('Tickets') }}</span>
                        <div class="stepper__row" v-for="type in ticketTypes" :key="type.key">
                            <div class="tour-tickets__type">
                                <span class="stepper__name">{{ $t(type.label) }}</span>
                                <small v-if="fareFor(type.key) != null">RM {{ money(fareFor(type.key)) }}</small>
                                <small v-else class="tour-tickets__na">{{ hasSchedules && !schedule ? $t('Select a departure to see fares') : $t('Not available') }}</small>
                            </div>
                            <div class="stepper__controls">
                                <button type="button" class="stepper__btn" :disabled="fareFor(type.key) == null || qty[type.key] <= 0" @click="decrement(type.key)" :aria-label="$t('Remove') + ' ' + $t(type.label)"><svg-icon name="minus" /></button>
                                <span class="stepper__value">{{ qty[type.key] }}</span>
                                <button type="button" class="stepper__btn" :disabled="fareFor(type.key) == null" @click="increment(type.key)" :aria-label="$t('Add') + ' ' + $t(type.label)"><svg-icon name="plus" /></button>
                            </div>
                        </div>
                    </div>

                    <!-- Totals -->
                    <dl class="price-list tour-book__lines" v-if="totalPax > 0">
                        <div v-for="type in ticketTypes" :key="'line-' + type.key" v-show="qty[type.key] > 0">
                            <dt>{{ $t(type.label) }} &times; {{ qty[type.key] }}</dt>
                            <dd>RM {{ money(qty[type.key] * parseFloat(fareFor(type.key) || 0)) }}</dd>
                        </div>
                    </dl>
                    <div class="price-total">
                        <span>{{ $t('Total') }} (MYR) &middot; {{ totalPax }} {{ $t('Pax') }}</span>
                        <span>RM {{ money(subtotalPrice) }}</span>
                    </div>

                    <button type="button" class="btn btn-primary btn-lg w-100 tour-book__cta" @click="bookTour()">{{ $t('Book Now') }}</button>
                    <p class="tour-book__note" v-if="!user"><svg-icon name="lock" /> {{ $t('You will be asked to sign in before payment.') }}</p>
                    <p class="tour-book__note" v-else><svg-icon name="shield-check" /> {{ $t('Secure online payment') }}</p>
                </div>
            </aside>
        </div>

        <!-- Lightbox -->
        <div class="modal fade tour-lightbox" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-xl">
                <div class="modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title" id="imageModalLabel">{{ tour.name }} <small class="text-muted">{{ galleryIndex + 1 }} / {{ allImages.length }}</small></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body pt-0">
                        <div class="tour-lightbox__stage">
                            <img :src="allImages[galleryIndex]" :alt="tour.name" v-if="allImages.length" />
                            <button type="button" class="tour-lightbox__nav tour-lightbox__nav--prev" @click="stepGallery(-1)" v-if="allImages.length > 1" :aria-label="$t('Previous')"><svg-icon name="chevron-left" /></button>
                            <button type="button" class="tour-lightbox__nav tour-lightbox__nav--next" @click="stepGallery(1)" v-if="allImages.length > 1" :aria-label="$t('Next')"><svg-icon name="chevron-right" /></button>
                        </div>
                        <div class="tour-lightbox__thumbs" v-if="allImages.length > 1">
                            <button type="button" v-for="(image, index) in allImages" :key="'lb-' + index" :class="{ 'is-active': index === galleryIndex }" @click="galleryIndex = index">
                                <img :src="image" alt="" loading="lazy" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- STEP 1: Details & Payment (same layout as the taxi / car charter checkouts) -->
    <div class="tour-checkout" v-if="step == 1">
        <!-- Trip details bar -->
        <div class="tr-trip-bar mb-4">
            <div class="tr-trip-route">
                <div class="tr-trip-point">
                    <span class="tr-trip-label">{{ $t('Tour') }}</span>
                    <span class="tr-trip-value">{{ tour.name }}</span>
                </div>
            </div>
            <div class="tr-trip-meta">
                <span class="tr-trip-chip" v-if="hasSchedules && schedule"><svg-icon name="route" /> {{ schedule.origin }} &rarr; {{ schedule.destination }}</span>
                <span class="tr-trip-chip"><svg-icon name="calendar" /> {{ schedule ? selectedDateText + ' ' + schedule.time_text : selectedDateText }}</span>
                <span class="tr-trip-chip" v-if="isReturn && returnSchedule"><svg-icon name="arrows-exchange" /> {{ $t('Return') }} {{ returnSchedule.time_text }}</span>
                <span class="tr-trip-chip"><svg-icon name="users" /> {{ totalPax }} {{ $t('Pax') }}</span>
                <button type="button" class="tr-trip-edit ms-auto" @click="step = 0"><svg-icon name="pencil" class="me-1" />{{ $t('Change') }}</button>
            </div>
        </div>

        <!-- Stepper -->
        <div class="tr-steps my-4">
            <div v-for="s in steps" :key="s.n"
                 :class="['tr-step', checkoutStep === s.n ? 'active' : '', checkoutStep > s.n ? 'done' : '']"
                 @click="checkoutStep > s.n && (step = 0)">
                <span class="tr-step-num">
                    <svg-icon name="check" v-if="checkoutStep > s.n" />
                    <template v-else>{{ s.n }}</template>
                </span>
                <span class="tr-step-label">{{ s.label }}</span>
            </div>
        </div>

        <h4 class="mb-3">{{ $t('Details & Payment') }}</h4>
        <div class="mb-3">
            <button type="button" class="btn btn-dark" @click="step = 0"><svg-icon name="arrow-left" class="me-1" />{{ $t('Back') }}</button>
        </div>

        <form id="submit-form" method="POST" @submit.prevent>
            <div class="row">
                <div class="col-lg-7 mb-4">
                    <section class="panel">
                        <div class="panel__head">
                            <h2 class="panel__title mb-0">{{ $t('Billing Details') }}</h2>
                            <a v-if="!user" href="/login" class="text-link">{{ $t('Please login to book this tour.') }}</a>
                        </div>
                        <div class="field-grid field-grid--2">
                            <div class="field">
                                <label for="billing-name" class="field__label">{{ $t('Full Name') }} *</label>
                                <input type="text" id="billing-name" class="form-control" name="billing_name" v-model="billingName" required :placeholder="trans('Full Name')" />
                            </div>
                            <div class="field">
                                <label for="billing-id-passport" class="field__label">{{ $t('ID / Passport No.') }}</label>
                                <input type="text" id="billing-id-passport" name="billing_id_passport" class="form-control" v-model="billingIdPassport" :placeholder="trans('ID / Passport No.')" />
                            </div>
                            <div class="field">
                                <label for="billing-email" class="field__label">{{ $t('Email Address') }} *</label>
                                <input type="email" id="billing-email" name="billing_email" class="form-control" v-model="billingEmail" :placeholder="trans('Email')" required />
                            </div>
                            <div class="field" :class="{ 'is-invalid': localErrors.phone_num }">
                                <label for="phone-num" class="field__label">{{ $t('Phone Number') }} *</label>
                                <input type="hidden" name="billing_phone" :value="billingPhone">
                                <div class="phone-field">
                                    <div class="phone-field__code">
                                        <multi-select :placeholder="trans('Code')"
                                                      v-model="country"
                                                      label="country_name_calling_code"
                                                      track-by="calling_code"
                                                      :options="countries"
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
                                    <input type="tel" id="phone-num" class="form-control" name="phone_num" v-model="phoneNum" placeholder="123456789" @input="clearError('phone_num')" required />
                                </div>
                                <template v-if="localErrors.phone_num">
                                    <p class="field__error" v-for="error in localErrors.phone_num">{{ error }}</p>
                                </template>
                            </div>
                        </div>

                        <div class="form-check mt-4" v-if="tour.id == 41">
                            <input class="form-check-input" type="checkbox" id="accept_terms" name="accept_terms" value="1" required>
                            <label class="form-check-label" for="accept_terms">
                                {{ $t('I have read and accept the Terms and Conditions') }}
                            </label>
                        </div>
                    </section>
                </div>

                <div class="col-lg-5">
                    <div class="card tr-summary-card">
                        <div class="card-body">
                            <h6 class="text-uppercase text-muted mb-3">{{ $t('Booking Summary') }}</h6>

                            <!-- selected tour -->
                            <div class="tr-sum-vehicle">
                                <div class="tr-sum-vehicle-img">
                                    <img :src="tour.main_image" :alt="tour.name" v-if="tour.main_image" />
                                    <svg-icon name="compass" v-else />
                                </div>
                                <div>
                                    <div class="fw-semibold">{{ tour.name }}</div>
                                    <div class="small text-muted" v-if="hasSchedules && schedule">{{ isReturn ? $t('Return trip') : $t('One way') }}</div>
                                </div>
                            </div>

                            <!-- trip rows -->
                            <div class="tr-sum-trip">
                                <div class="tr-sum-row" v-if="packages.length">
                                    <svg-icon name="tag" />
                                    <div>
                                        <span class="tr-sum-label">{{ $t('Package') }}</span>
                                        <span class="tr-sum-val">{{ selectedPackage ? ((selectedPackage.code ? selectedPackage.code + ' : ' : '') + selectedPackage.name) : '-' }}</span>
                                    </div>
                                </div>
                                <div class="tr-sum-row" v-if="hasSchedules">
                                    <svg-icon name="route" />
                                    <div>
                                        <span class="tr-sum-label">{{ $t('Route') }}</span>
                                        <span class="tr-sum-val">{{ schedule ? schedule.origin + ' → ' + schedule.destination : '-' }}</span>
                                    </div>
                                </div>
                                <div class="tr-sum-row">
                                    <svg-icon name="calendar" />
                                    <div>
                                        <span class="tr-sum-label">{{ $t('Date') }}</span>
                                        <span class="tr-sum-val">{{ selectedDateText }}</span>
                                    </div>
                                </div>
                                <div class="tr-sum-row" v-if="hasSchedules">
                                    <svg-icon name="clock" />
                                    <div>
                                        <span class="tr-sum-label">{{ $t('Departure') }}</span>
                                        <span class="tr-sum-val">{{ schedule?.time_text ?? '-' }}</span>
                                    </div>
                                </div>
                                <div class="tr-sum-row" v-if="hasSchedules && isReturn">
                                    <svg-icon name="arrows-exchange" />
                                    <div>
                                        <span class="tr-sum-label">{{ $t('Return') }}</span>
                                        <span class="tr-sum-val">{{ returnSchedule?.time_text ?? '-' }}</span>
                                    </div>
                                </div>
                                <div class="tr-sum-row">
                                    <svg-icon name="users" />
                                    <div>
                                        <span class="tr-sum-label">{{ $t('Pax') }}</span>
                                        <span class="tr-sum-val">{{ totalPax }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- price breakdown -->
                            <div class="tr-sum-prices">
                                <template v-for="type in ticketTypes" :key="'sum-' + type.key">
                                    <div class="d-flex justify-content-between mt-1" v-if="qty[type.key] > 0">
                                        <span class="text-muted">{{ $t(type.label) }} &times; {{ qty[type.key] }}</span>
                                        <span>RM {{ money(qty[type.key] * parseFloat(fareFor(type.key) || 0)) }}</span>
                                    </div>
                                </template>
                                <div class="d-flex justify-content-between mt-3">
                                    <span class="text-muted">{{ $t('Subtotal') }}</span>
                                    <span>RM {{ money(subtotalPrice) }}</span>
                                </div>
                                <div class="d-flex justify-content-between mt-1" v-if="discountPrice > 0">
                                    <span class="text-muted">{{ $t('Discount') }}</span>
                                    <span class="text-success">- RM {{ money(discountPrice) }}</span>
                                </div>
                            </div>

                            <div class="tr-sum-total">
                                <span>{{ $t('Total') }} (MYR)</span>
                                <span>RM {{ money(totalPrice) }}</span>
                            </div>

                            <!-- discount code -->
                            <div class="tr-sum-code">
                                <label for="discount-code" class="form-label"><svg-icon name="tag" class="me-1" />{{ $t('Discount code') }}</label>
                                <input type="text" id="discount-code" class="form-control" name="discount_code" v-model="discountCode" :placeholder="trans('Apply Discount Code')" @input="discountCode = $event.target.value.toUpperCase()" autocomplete="off" />
                                <small v-if="discountCode && !matchedDiscount" class="text-danger d-block mt-1">
                                    {{ $t('This discount code is invalid or has reached its usage limit') }}.
                                </small>
                                <small v-else-if="discountCode && matchedDiscount" class="text-success d-block mt-1">
                                    <svg-icon name="circle-check" class="me-1" />{{ $t('Discount Applied') }}.
                                </small>
                            </div>

                            <div class="tr-sum-points" v-if="user">
                                <span>{{ $t('Your Points') }}</span>
                                <span class="fw-bold" style="color:#1b5e20;">{{ user.points }}</span>
                            </div>

                            <!-- hidden fields -->
                            <input type="hidden" name="tour_id" :value="tour.id" />
                            <input type="hidden" name="payment" value="1" />
                            <input type="hidden" name="date" :value="hasSchedules ? (schedule?.date_text ?? '') : date" />
                            <input type="hidden" name="tour_package_id" :value="selectedPackage?.id ?? ''" />
                            <input type="hidden" name="tour_schedule_id" :value="schedule?.id ?? ''" />
                            <input type="hidden" name="return_tour_schedule_id" :value="isReturn ? (returnSchedule?.id ?? '') : ''" />
                            <input type="hidden" name="adult_tickets" :value="qty.adult" />
                            <input type="hidden" name="child_tickets" :value="qty.child" />
                            <input type="hidden" name="senior_tickets" :value="qty.senior" />

                            <button class="btn btn-success text-white w-100 mt-3" @click="createTourBooking(true)" v-if="user" type="button" :disabled="loading || user.points < totalPrice">
                                <img v-if="loading && usePoints" src="/images/loading.gif" /><span v-else>{{ $t('Use Points') }}</span>
                            </button>
                            <button class="btn btn-primary text-white w-100 mt-2" @click="createTourBooking(false)" v-if="user" type="button" :disabled="loading">
                                <img v-if="loading && !usePoints" src="/images/loading.gif" /><span v-else>{{ $t('Make Payment') }}</span>
                            </button>
                            <a class="btn btn-primary text-white w-100 mt-3" v-else href="/login">{{ $t('Login to Book') }}</a>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>
<script setup>
    import { ref, onMounted, computed, watch, nextTick } from 'vue';
    import { trans } from "laravel-vue-i18n";

    let props = defineProps({
        tour: Object,
        discountCodes: Object,
        user: Object,
        env: String,
        countries: Array,
        errors: Object,
    });

    const localErrors = ref({ ...props.errors });
    const country = ref({"name":"Malaysia","official_name":"Malaysia","native_name":"Malaysia","native_official_name":"Malaysia","iso_3166_1_alpha2":"MY","iso_3166_1_alpha3":"MYS","calling_code":"60","currency":"MYR","emoji":"🇲🇾","country_name_calling_code":"Malaysia (+60)"});
    const countries = ref([]);

    const step = ref(0);

    // The checkout stepper mirrors the taxi / car charter flow: ticket selection
    // happens on the tour page (step 0), so on the payment page it is always done.
    const steps = computed(() => [
        { n: 1, label: trans('Select Tickets') },
        { n: 2, label: trans('Details & Payment') },
    ]);
    const checkoutStep = computed(() => step.value + 1);

    const today = new Date()
    const date = ref(null)

    const schedule = ref(null)

    const selectedPackage = ref(null)

    // Declared here, not with the other return state below: selectPackage()
    // clears it, and a const is in its temporal dead zone until declared.
    const returnSchedule = ref(null)

    // Only active packages are serialized, so this is exactly what is on sale.
    const packages = computed(() => props.tour.active_packages ?? [])

    const selectPackage = (option) => {
        if (option.is_sold_out) {
            return
        }

        /*
         * No toggling off: a tour that defines packages is only sellable on one
         * of them, which is what the server enforces when resolving the sale.
         */
        selectedPackage.value = option
        schedule.value = null
        returnSchedule.value = null
    }

    /*
     * A schedule tied to another package is never offered, and where the chosen
     * package has its own row at the same date, time and leg, that row SHADOWS
     * the generic one rather than both being listed.
     */
    const applyPackagePrecedence = (rows) => {
        const packageId = selectedPackage.value?.id
        const usable = rows.filter((row) => !row.tour_package_id || row.tour_package_id === packageId)

        if (!packageId) {
            return usable
        }

        const key = (row) => [row.date_text, row.time ?? '', row.is_return_leg ? 1 : 0].join('|')
        const shadowed = new Set(
            usable.filter((row) => row.tour_package_id === packageId).map(key)
        )

        return usable.filter((row) => row.tour_package_id === packageId || !shadowed.has(key(row)))
    }

    /*
     * Only departures with a seat left are offered. bookableSchedules already
     * filters on the server; this guards against a stale page.
     */
    const schedules = computed(() =>
        applyPackagePrecedence(props.tour.bookable_schedules ?? [])
            .filter((option) => option.available_seats > 0)
    )

    const route = ref(null)

    const departureDate = ref(null)

    const routeKey = (option) => option.origin + ' → ' + option.destination

    // Route -> Date -> Time, so a long flat list never has to be scanned.
    const routeOptions = computed(() => {
        const seen = new Map()
        schedules.value.forEach((option) => {
            const key = routeKey(option)
            if (!seen.has(key)) {
                seen.set(key, { key, origin: option.origin, destination: option.destination })
            }
        })
        return [...seen.values()]
    })

    const dateOptions = computed(() => {
        if (!route.value) {
            return []
        }
        return [...new Set(
            schedules.value
                .filter((option) => routeKey(option) === route.value)
                .map((option) => option.date_text)
        )].sort()
    })

    const timeOptions = computed(() => {
        if (!route.value || !departureDate.value) {
            return []
        }
        return schedules.value
            .filter((option) => routeKey(option) === route.value && option.date_text === departureDate.value)
            .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
    })

    // Narrowing the choice above invalidates whatever was picked below it.
    watch(route, () => {
        departureDate.value = null
        schedule.value = null
    })

    watch(departureDate, () => {
        schedule.value = null
    })

    // Gate on the same flag the server gates on. Gating on "has bookable schedules"
    // would show a free date picker once every departure is past or sold out, and
    // every submission would then be rejected.
    const hasSchedules = computed(() => props.tour.uses_schedules === true)

    const isReturn = ref(false)


    // The outbound schedule carries the round-trip fare for the whole trip.
    const offersReturn = computed(() => schedule.value?.offers_return === true)

    // A return-required tour cannot be sold one way, so the toggle is locked on.
    const requiresReturn = computed(() => props.tour.requires_return === true)

    const returnCandidates = computed(() =>
        applyPackagePrecedence(props.tour.return_schedules ?? [])
            .filter((option) => option.available_seats > 0)
    )

    /*
     * A return leg runs the reverse route on the SAME DAY: KLIA2 -> Sepang returns
     * as Sepang -> KLIA2 later that day. Every qualifying timeslot is offered, so
     * the customer picks whichever one they want.
     */
    const returnOptions = computed(() => {
        if (!schedule.value) {
            return []
        }
        return returnCandidates.value.filter((option) => {
            if (option.id === schedule.value.id) {
                return false
            }
            if (option.origin !== schedule.value.destination || option.destination !== schedule.value.origin) {
                return false
            }
            if (option.date_text !== schedule.value.date_text) {
                return false
            }
            return (option.time ?? '') >= (schedule.value.time ?? '')
        })
    })

    // Fares live on the schedule row, since schedules differ by date, time and
    // direction. A return charges the flat round-trip fare instead of the one-way.
    // Tours without schedules keep pricing off the tour.
    /*
     * Fare chain, most specific first: a package-specific schedule that prices
     * itself, then the package, then a generic schedule, then the tour. The
     * schedule's effective_* already falls back to the TOUR, so a blank
     * package-specific row must not short-circuit the package's own fare.
     */
    const fareFor = (type) => {
        const ownFare = schedule.value
            && (schedule.value[type + '_price'] !== null || schedule.value['return_' + type + '_price'] !== null)

        if (schedule.value && schedule.value.tour_package_id && ownFare) {
            return isReturn.value
                ? schedule.value['effective_return_' + type + '_price']
                : schedule.value['effective_' + type + '_price']
        }

        if (selectedPackage.value && selectedPackage.value[type + '_price'] !== null
            && selectedPackage.value[type + '_price'] !== undefined) {
            return selectedPackage.value[type + '_price']
        }

        if (schedule.value) {
            return isReturn.value
                ? schedule.value['effective_return_' + type + '_price']
                : schedule.value['effective_' + type + '_price']
        }

        return props.tour[type + '_price']
    }

    const onReturnToggle = () => {
        if (!isReturn.value) {
            returnSchedule.value = null
        }
    }

    // Drop a return leg that no longer follows the selected departure.
    watch(schedule, () => {
        if (returnSchedule.value && !returnOptions.value.some((option) => option.id === returnSchedule.value.id)) {
            returnSchedule.value = null
        }
        if (requiresReturn.value && offersReturn.value) {
            isReturn.value = true
        } else if (!offersReturn.value) {
            isReturn.value = false
            returnSchedule.value = null
        }
    })
    const qty = ref({
        adult: 0,
        child: 0,
        senior: 0
    })
    const customers = ref({});
    const loading = ref(false);
    const usePoints = ref(false);
    const discountCode = ref('');

    const billingName = ref(props.user ? props.user.name : '');
    const billingIdPassport = ref('');
    const phoneNum = ref(props.user ? props.user.phone_number : '');
    const billingEmail = ref(props.user ? props.user.email : '');

    const showFull = ref(false);
    const descBox = ref(null);
    const isTruncated = ref(false);

    const minDays = props.tour.min_days - 1
    const maxDays = props.tour.max_days - 1
    const minDate = today
    const maxDate = props.tour.end_date

    const ticketTypes = [
        { key: 'adult', label: 'Adult', column_key: 'adult_price' },
        { key: 'child', label: 'Child', column_key: 'child_price' },
        { key: 'senior', label: 'Senior', column_key: 'senior_price' }
    ]

    // Gallery: the main image first, then the extra images.
    const allImages = computed(() => {
        const extras = Array.isArray(props.tour.images) ? props.tour.images.filter(Boolean) : []
        return [props.tour.main_image, ...extras].filter(Boolean)
    })
    const sideImages = computed(() => allImages.value.slice(1, 3))
    const galleryIndex = ref(0)

    const openGallery = (index) => {
        galleryIndex.value = index
        const el = document.getElementById('imageModal')
        if (el && window.bootstrap) {
            window.bootstrap.Modal.getOrCreateInstance(el).show()
        }
    }

    const stepGallery = (direction) => {
        const len = allImages.value.length
        if (len < 2) return
        galleryIndex.value = (galleryIndex.value + direction + len) % len
    }

    const money = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    watch(qty, (newVal) => {
        const newCustomers = [];

        for (const type of ticketTypes) {
            const count = newVal[type.key] || 0;

            for (let i = 0; i < count; i++) {
                newCustomers.push({
                    ticket_type_label: type.key,
                    name: ''
                });
            }
        }

        customers.value = newCustomers;
    }, { immediate: true, deep: true });


    const formatDate = (date) => {
        if (!date) return ''

        if (Array.isArray(date)) {
            const [start, end] = date
            const startStr = start instanceof Date ? start.getFullYear() + '-' + (start.getMonth() + 1).toString().padStart(2, "0") + '-' + start.getDate().toString().padStart(2, "0") : ''
            const endStr = end instanceof Date ? end.getFullYear() + '-' + (end.getMonth() + 1).toString().padStart(2, "0") + '-' + end.getDate().toString().padStart(2, "0") : ''
            return startStr && endStr ? `${startStr} - ${endStr}` : startStr || endStr
        }

        if (date instanceof Date) {
            return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, "0") + '-' + date.getDate().toString().padStart(2, "0");
        }

        return date;
    }

    // Human-readable date for the trip bar and summary, whichever selection mode applies.
    const selectedDateText = computed(() => {
        if (hasSchedules.value) {
            return schedule.value?.date_text ?? '-'
        }
        return formatDate(date.value) || '-'
    })

    const clearError = (field) => {
        if (localErrors.value[field]) {
            delete localErrors.value[field];
        }
    };

    // The description is clamped to a few lines; only show the toggle when it overflows.
    const measureDescription = () => {
        nextTick(() => {
            if (descBox.value) {
                isTruncated.value = descBox.value.scrollHeight > descBox.value.clientHeight + 4 || isTruncated.value;
            }
        })
    }

    onMounted(() => {
        measureDescription();

        countries.value = (props.countries || []).filter(c => c.calling_code).map(c => ({
            ...c,
            country_name_calling_code: `${c.name} (+${c.calling_code})`,
        }));

        if (props?.user?.country_code) {
            country.value = countries.value.find(c => '+' + c.calling_code === props.user.country_code) || country.value;
        }
    })

    // Coming back from the checkout re-renders the tour page, so re-measure.
    watch(step, (value) => {
        if (value === 0) {
            measureDescription();
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    })

    const billingPhone = computed(() => {
        if (country.value) {
            return country.value.calling_code + '' + phoneNum.value;
        }
        return phoneNum.value;
    })

    function increment(type) {
        qty.value[type]++
    }

    function decrement(type) {
        if (qty.value[type] > 0) qty.value[type]--
    }

    const totalPax = computed(() => {
        return qty.value.adult + qty.value.child + qty.value.senior
    })

    const matchedDiscount = computed(() => {
        const code = discountCode.value?.trim().toUpperCase();
        if (!code) return null;
        return props.discountCodes.find(d => d.code.toUpperCase() === code) || null;
    });

    const discountPrice = computed(() => {
        const discount = matchedDiscount.value;
        if (!discount) return 0;

        const subtotal = subtotalPrice.value;
        const isPercentage = discount.is_percentage == 1;
        let discountAmount = parseFloat(discount.discount_amount || 0);
        let maximumDiscount = parseFloat(discount.maximum_discount || 0);

        let calculated = isPercentage ? subtotal * (discountAmount / 100) : discountAmount;

        if (!isNaN(maximumDiscount) && maximumDiscount > 0 && calculated >= maximumDiscount) {
            calculated = maximumDiscount;
        }

        return calculated;
    });

    const subtotalPrice = computed(() => {
        return (qty.value.adult * parseFloat(fareFor('adult') || 0)) + (qty.value.child * parseFloat(fareFor('child') || 0)) + (qty.value.senior * parseFloat(fareFor('senior') || 0))
    })

    const totalPrice = computed(() => {
        return Math.max(subtotalPrice.value - discountPrice.value, 0);
    });

    const validateTour = () => {
        /*
         * Checked before pax and departure: a tour that defines packages is
         * only sellable on one of them, which the server enforces when it
         * resolves the sale, and the fare shown depends on which is picked.
         */
        if (packages.value.length && !selectedPackage.value) {
            Swal.fire({
                icon: "error",
                title: trans("Error") + '!',
                text: trans("Select a package"),
            })
            return false;
        }

        if (totalPax.value <= 0) {
            Swal.fire({
                icon: "error",
                title: trans("Error") + '!',
                text: trans("Select Pax"),
            })
            return false;
        }

        if (hasSchedules.value) {
            if (schedule.value == null) {
                Swal.fire({
                    icon: "error",
                    title: trans("Error") + '!',
                    text: trans("Select Departure"),
                })
                return false;
            }

            if (totalPax.value > schedule.value.available_seats) {
                Swal.fire({
                    icon: "error",
                    title: trans("Error") + '!',
                    text: trans("Not enough seats available for this departure."),
                })
                return false;
            }

            if (isReturn.value) {
                if (returnSchedule.value == null) {
                    Swal.fire({
                        icon: "error",
                        title: trans("Error") + '!',
                        text: trans("Select Return Departure"),
                    })
                    return false;
                }

                // Every leg needs a seat per pax.
                if (totalPax.value > returnSchedule.value.available_seats) {
                    Swal.fire({
                        icon: "error",
                        title: trans("Error") + '!',
                        text: trans("Not enough seats available for the return departure."),
                    })
                    return false;
                }
            }
        } else if (date.value == null) {
             Swal.fire({
                icon: "error",
                title: trans("Error") + '!',
                text: trans("Select Date"),
            })
            return false;
        }

        return true;
    }

    const bookTour = () => {
        if (validateTour()) {
            step.value = 1;
        }
    }

    const createTourBooking = (points) => {
        if (loading.value) {
            return;
        }
        if (!$("#submit-form")[0].checkValidity()) {
            $("#submit-form")[0].reportValidity();
            return;
        }
        usePoints.value = points;
        loading.value = true;

        let formData = new FormData($('#submit-form')[0]);
        formData.append('use_points', points ? 1 : 0);
        axios.post('/tour-orders', formData).then((response) => {
            let booking = response.data.response;
            if (points) {
                window.location.href= '/tour-orders/' + booking.code + '/' + booking.web_session_id;
                return;
            }
            let req = booking.payment_params;
            if (booking.payment_url) {
                window.location.replace(booking.payment_url);
            } else {
                Swal.fire({
                    icon: "success",
                    title: trans("Success") + '!',
                    text: trans('Successfully confirmed your tour booking. Please proceed to make payment.'),
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
                    }
                    const form = document.createElement('form')
                    form.method = 'post'
                    if (props.env === "production") {
                        form.action = 'https://securepay.e-ghl.com/IPG/Payment.aspx'
                    } else {
                        form.action = 'https://pay.e-ghl.com/IPGSG/Payment.aspx'
                    }
                    for (const key in formData) {
                        const input = document.createElement('input')
                        input.type = 'hidden'
                        input.name = key
                        input.value = formData[key]
                        form.appendChild(input)
                    }
                    document.body.appendChild(form);
                    form.submit()
                    document.body.removeChild(form);
                });
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
                    })
                }
            } else if (error.request) {
                console.log(error.request);
            } else {
                console.log('Error', error.message);
            }
            console.log(error.config);
        });
    };
</script>
<style scoped>
/* ------------------------------------------------------------------ Tour page */
.tour .back-link { margin-bottom: var(--space-4); }

/* Gallery: one large image with two stacked thumbnails beside it */
.tour-gallery {
    position: relative;
    display: grid;
    gap: var(--space-2);
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    margin-bottom: var(--space-6);
    border-radius: var(--radius-search);
    overflow: hidden;
    background: var(--surface-2);
}
.tour-gallery--single { grid-template-columns: minmax(0, 1fr); }
.tour-gallery__main,
.tour-gallery__thumb {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: var(--surface-2);
    overflow: hidden;
    cursor: zoom-in;
}
.tour-gallery__main { aspect-ratio: 16 / 10; }
.tour-gallery--single .tour-gallery__main { aspect-ratio: 21 / 9; }
.tour-gallery__side { display: grid; gap: var(--space-2); grid-template-rows: 1fr 1fr; min-height: 0; }
.tour-gallery__thumb { height: 100%; }
.tour-gallery__main img,
.tour-gallery__thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--dur-slow) var(--ease-standard);
}
.tour-gallery__main:hover img,
.tour-gallery__thumb:hover img { transform: scale(1.03); }
.tour-gallery__all {
    position: absolute;
    right: var(--space-4);
    bottom: var(--space-4);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 36px;
    padding: 0 var(--space-4);
    border: 0;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.95);
    color: var(--ink);
    font-size: var(--fs-14);
    font-weight: 500;
    box-shadow: var(--shadow-1);
}
.tour-gallery__all:hover { background: #fff; }
.tour-gallery__all .icon { width: 18px; height: 18px; }
@media (max-width: 767.98px) {
    .tour-gallery { grid-template-columns: minmax(0, 1fr); border-radius: var(--radius-card); }
    .tour-gallery__main { aspect-ratio: 4 / 3; }
    .tour-gallery__side { grid-template-rows: none; grid-template-columns: 1fr 1fr; }
    .tour-gallery__thumb { aspect-ratio: 16 / 10; }
}

/* Title block */
.tour-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-4) var(--space-6);
    margin-bottom: var(--space-6);
}
.tour-head__copy { flex: 1 1 320px; min-width: 0; }
.tour-head__kicker {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    margin-bottom: var(--space-2);
    color: var(--brand-700);
    font-size: var(--fs-12);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}
.tour-head__kicker .icon { width: 16px; height: 16px; }
.tour-head__title {
    margin: 0;
    font-size: var(--fs-28);
    line-height: 1.15;
    letter-spacing: -0.01em;
}
@media (min-width: 992px) { .tour-head__title { font-size: var(--fs-36); } }
.tour-head__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
}
.tour-head__meta li {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--ink-3);
    font-size: var(--fs-14);
}
.tour-head__meta .icon { width: 18px; height: 18px; color: var(--brand-600); }
.tour-head__price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: var(--space-3) var(--space-5);
    background: var(--brand-50);
    border-radius: var(--radius-card);
    text-align: right;
    line-height: 1.2;
}
.tour-head__price span,
.tour-head__price small { color: var(--ink-3); font-size: var(--fs-12); font-weight: 500; }
.tour-head__price strong { color: var(--brand-700); font-size: var(--fs-22); font-weight: 700; }

/* Two column layout with a sticky booking panel */
.tour-layout {
    display: grid;
    gap: var(--space-4);
    align-items: start;
}
@media (min-width: 992px) {
    .tour-layout { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: var(--space-6); }
    .tour-layout__aside { position: sticky; top: calc(var(--header-h) + var(--space-4)); }
}
@media (max-width: 991.98px) {
    /* Booking panel first on small screens so the action is in view. */
    .tour-layout__aside { order: -1; }
}

/* Description */
.tour-desc {
    color: var(--ink-2);
    line-height: 1.65;
    white-space: pre-line;
}
.tour-desc--clamped {
    display: -webkit-box;
    -webkit-line-clamp: 8;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.tour-desc__toggle {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-top: var(--space-3);
    padding: 0;
    border: 0;
    background: none;
    color: var(--brand-600);
    font-size: var(--fs-14);
    font-weight: 500;
}
.tour-desc__toggle:hover { color: var(--brand-700); }
.tour-desc__toggle .icon { width: 16px; height: 16px; }

/* Good to know */
.tour-facts {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
}
@media (min-width: 576px) { .tour-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.tour-facts li {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--surface-2);
    border-radius: var(--radius-input);
    color: var(--ink-2);
    font-size: var(--fs-14);
}
.tour-facts .icon { flex-shrink: 0; width: 22px; height: 22px; color: var(--brand-600); }

/* How it works */
.tour-how {
    display: grid;
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
}
@media (min-width: 768px) { .tour-how { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.tour-how li { display: flex; align-items: flex-start; gap: var(--space-3); }
.tour-how strong { display: block; color: var(--ink); font-size: var(--fs-14); }
.tour-how span:not(.tour-how__num) { color: var(--ink-3); font-size: var(--fs-14); line-height: 1.45; }
.tour-how__num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--brand-50);
    color: var(--brand-700);
    font-size: var(--fs-14);
    font-weight: 700;
}

/* Booking panel */
.tour-book { box-shadow: var(--shadow-2); }
.tour-book__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
}
.tour-book__head .panel__title { margin: 0; }
.tour-book__from { color: var(--ink-3); font-size: var(--fs-14); white-space: nowrap; }
.tour-book__from strong { color: var(--brand-700); font-size: var(--fs-18); }
.tour-field { margin-bottom: var(--space-4); }
.tour-field .form-label { margin-bottom: var(--space-1); color: var(--ink); font-size: var(--fs-14); font-weight: 500; }
.tour-field .form-select,
.tour-field :deep(.dp__input) { min-height: 46px; }
.tour-field__hint { display: block; margin-top: var(--space-1); color: var(--ink-3); font-size: var(--fs-12); }

/* Package chips: the tour's sellable variants, picked before a date. */
.tour-packages { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.tour-package {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--radius-input);
    background: transparent;
    color: var(--ink);
    font-size: var(--fs-14);
    text-align: left;
    cursor: pointer;
    transition: border-color var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard);
}
.tour-package:hover:not(:disabled) { border-color: var(--brand-600); }
.tour-package--active {
    border-color: var(--brand-600);
    background: var(--brand-50);
    color: var(--brand-700);
}
.tour-package--out { opacity: .55; cursor: not-allowed; }
.tour-package__badge {
    align-self: flex-start;
    padding: 1px 6px;
    border-radius: var(--radius-input);
    background: var(--brand-50);
    color: var(--brand-700);
    font-size: var(--fs-12);
    font-weight: 600;
    text-transform: uppercase;
}
.tour-package__name { font-weight: 500; }
.tour-package__code { color: var(--ink-3); }
.tour-package__price { color: var(--ink-2); font-size: var(--fs-12); }
.tour-package__price s { margin-right: 4px; color: var(--ink-3); }
.tour-package__out { color: var(--ink-3); font-size: var(--fs-12); }
.tour-package__desc { margin-top: var(--space-2); color: var(--ink-2); font-size: var(--fs-12); }
.tour-field__error { display: block; margin-top: var(--space-1); color: var(--brand-700); font-size: var(--fs-12); }
.tour-note {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: #EFF6FF;
    border-radius: var(--radius-input);
    color: #1E40AF;
    font-size: var(--fs-14);
}
.tour-note .icon { flex-shrink: 0; width: 18px; height: 18px; margin-top: 2px; }
.tour-switch { padding-left: 2.75em; min-height: 24px; }
.tour-switch .form-check-input { width: 2.25em; height: 1.25em; margin-left: -2.75em; }
.tour-switch .form-check-input:checked { background-color: var(--brand-600); border-color: var(--brand-600); }
.tour-switch .form-check-label { font-weight: 500; color: var(--ink); }

.tour-tickets { margin-top: var(--space-2); }
.tour-tickets > .form-label { display: block; margin-bottom: 0; color: var(--ink); font-size: var(--fs-14); font-weight: 500; }
.tour-tickets__type { display: flex; flex-direction: column; min-width: 0; }
.tour-tickets__type small { color: var(--ink-3); font-size: var(--fs-12); }
.tour-tickets__na { color: var(--ink-3); font-style: italic; }
.tour-tickets .stepper__btn .icon { width: 16px; height: 16px; }

.tour-book__lines { margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--line); }
.tour-book .price-total { margin-top: var(--space-4); }
.tour-book__cta { margin-top: var(--space-4); font-weight: 700; }
.tour-book__note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    margin: var(--space-3) 0 0;
    color: var(--ink-3);
    font-size: var(--fs-12);
    text-align: center;
}
.tour-book__note .icon { width: 14px; height: 14px; }

/* Lightbox */
.tour-lightbox .modal-content { border: 0; border-radius: var(--radius-search); }
.tour-lightbox .modal-title { font-size: var(--fs-16); }
.tour-lightbox .modal-title small { font-size: var(--fs-14); margin-left: var(--space-2); }
.tour-lightbox__stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: min(70vh, 640px);
    background: var(--surface-2);
    border-radius: var(--radius-card);
    overflow: hidden;
}
.tour-lightbox__stage img { max-width: 100%; max-height: 100%; object-fit: contain; }
.tour-lightbox__nav {
    position: absolute;
    top: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: rgba(17, 24, 39, 0.55);
    color: #fff;
    transform: translateY(-50%);
    transition: background var(--dur-fast) var(--ease-standard);
}
.tour-lightbox__nav:hover { background: rgba(17, 24, 39, 0.8); }
.tour-lightbox__nav .icon { width: 22px; height: 22px; }
.tour-lightbox__nav--prev { left: var(--space-3); }
.tour-lightbox__nav--next { right: var(--space-3); }
.tour-lightbox__thumbs {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
    overflow-x: auto;
    scrollbar-width: none;
}
.tour-lightbox__thumbs::-webkit-scrollbar { display: none; }
.tour-lightbox__thumbs button {
    flex: 0 0 auto;
    width: 72px;
    height: 54px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--radius-input);
    background: var(--surface-2);
    overflow: hidden;
    opacity: 0.7;
    transition: opacity var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard);
}
.tour-lightbox__thumbs button img { width: 100%; height: 100%; object-fit: cover; }
.tour-lightbox__thumbs button:hover,
.tour-lightbox__thumbs button.is-active { opacity: 1; border-color: var(--brand-600); }

/* ------------------------------------------------------------------ Checkout
   Same look as the taxi (tx-*) and car charter (cc-*) "Details & Payment" step. */
.tr-trip-bar {
    position: relative;
    overflow: hidden;
    padding: 1.25rem 1.5rem;
    border-radius: 16px;
    color: rgba(255,255,255,.78);
    background:
        radial-gradient(120% 140% at 100% 0%, rgba(217,0,4,.5) 0%, rgba(217,0,4,0) 55%),
        #111827;
}
.tr-trip-route { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.tr-trip-point { display: flex; flex-direction: column; min-width: 0; }
.tr-trip-label { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: rgba(255,255,255,.6); }
.tr-trip-value { font-weight: 700; font-size: 1.1rem; color: #fff; }
.tr-trip-meta { display: flex; align-items: center; gap: .5rem 1rem; flex-wrap: wrap; margin-top: .9rem; padding-top: .9rem; border-top: 1px solid rgba(255,255,255,.14); }
.tr-trip-chip { display: inline-flex; align-items: center; gap: .4rem; font-size: .85rem; color: #fff; }
.tr-trip-chip .svg-icon { color: #FF8A8C; }
.tr-trip-edit { display: inline-flex; align-items: center; min-height: 36px; padding: 0 .9rem; border: 1px solid rgba(255,255,255,.35); border-radius: 999px; background: none; color: #fff; font-size: .85rem; font-weight: 500; text-decoration: none; transition: background .15s, border-color .15s; }
.tr-trip-edit:hover { color: #fff; background: rgba(255,255,255,.12); border-color: #fff; }

/* Stepper */
.tr-steps { display: flex; align-items: center; justify-content: center; gap: 0; max-width: 520px; margin-left: auto; margin-right: auto; }
.tr-step { display: flex; flex-direction: column; align-items: center; gap: .4rem; flex: 1; position: relative; color: var(--bs-primary, #c1121f); font-size: .82rem; }
.tr-step:not(:first-child)::before { content: ''; position: absolute; top: 16px; left: -50%; width: 100%; height: 2px; background: color-mix(in srgb, var(--bs-primary, #c1121f) 30%, #fff); z-index: 0; }
.tr-step.active:not(:first-child)::before,
.tr-step.done:not(:first-child)::before { background: var(--bs-primary, #c1121f); }
.tr-step-num { width: 34px; height: 34px; border-radius: 50%; background: color-mix(in srgb, var(--bs-primary, #c1121f) 15%, #fff); color: var(--bs-primary, #c1121f); display: flex; align-items: center; justify-content: center; font-weight: 600; z-index: 1; transition: .15s; }
.tr-step.active .tr-step-num { background: var(--bs-primary, #c1121f); color: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--bs-primary, #c1121f) 20%, transparent); }
.tr-step.done .tr-step-num { background: var(--bs-primary, #c1121f); color: #fff; cursor: pointer; }
.tr-step-label { color: var(--bs-primary, #c1121f); }
.tr-step.active .tr-step-label, .tr-step.done .tr-step-label { font-weight: 700; }
.tr-step.done { cursor: pointer; }

/* Details card */

/* Phone country-code group - always on one line */

/* Summary card */
.tr-summary-card { border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,.06); position: sticky; top: 1rem; }
.tr-sum-vehicle { display: flex; align-items: center; gap: .8rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
.tr-sum-vehicle-img { flex: 0 0 72px; width: 72px; height: 50px; border-radius: 8px; overflow: hidden; background: #f4f4f4; display: flex; align-items: center; justify-content: center; }
.tr-sum-vehicle-img img { width: 100%; height: 100%; object-fit: cover; }
.tr-sum-vehicle-img .svg-icon { font-size: 1.6rem; color: var(--bs-primary, #c1121f); opacity: .85; }
.tr-sum-trip { padding: 1rem 0; display: flex; flex-direction: column; gap: .85rem; }
.tr-sum-row { display: flex; gap: .7rem; }
.tr-sum-row > .svg-icon { flex: 0 0 18px; margin-top: .15rem; color: var(--bs-primary, #c1121f); font-size: .95rem; text-align: center; }
.tr-sum-label { display: block; font-size: .72rem; text-transform: uppercase; letter-spacing: .03em; color: #aaa; }
.tr-sum-val { display: block; font-weight: 500; color: #2a2a2a; word-break: break-word; }
.tr-sum-prices { padding: 1rem 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
.tr-sum-total { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0 .5rem; font-weight: 700; font-size: 1.35rem; color: var(--bs-primary, #c1121f); }
.tr-sum-code { margin-top: .5rem; }
.tr-sum-code .form-label { display: inline-flex; align-items: center; margin-bottom: .35rem; font-size: .85rem; font-weight: 500; color: #374151; }
.tr-sum-code .form-label .svg-icon { color: var(--bs-primary, #c1121f); }
.tr-sum-points { display: flex; justify-content: space-between; align-items: center; padding: .6rem .85rem; margin-top: 1rem; background: #d9f0e3; border-radius: 10px; font-size: .9rem; }
.btn-success:disabled { background-color: #8b8b8b !important; color: black !important; }

@media (max-width: 575px) {
    .tr-step-label { font-size: .72rem; }
}
</style>
