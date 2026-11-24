<template>
    <img src="/images/klcc.jpg" class="d-block w-100 h-100 object-fit-cover" style="max-height: 50vh" alt="...">
    <div class="row">
        <div class="col-md-3 text-center" style="margin-top: -80px;">
            <img v-if="offer.logo" :src="offer.logo" alt="Logo" class="rounded-circle shadow mb-4"
                style="width: 200px; height: 200px; object-fit: contain; background-color: #f0f0f0; border: 2px solid #ddd;">
        </div>
        <div class="col-md-9 d-flex justify-content-end align-items-center">
            <a :href="props.redirectUrl" class="btn btn-outline-primary" >
                Shop Now
            </a>
        </div>
    </div>
    <div class="row">
        <div class="col-md-3 text-center">
            <h4>{{ offer.rebate }}</h4>
            <h5><b>{{ offer.offer_name }}</b></h5>
            <h5>{{ offer.cashback_offer_category.name }}</h5>

        </div>
        <div class="col-md-9">
            <ul class="nav nav-tabs" id="myTab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="information-tab" data-bs-toggle="tab"
                        data-bs-target="#information" type="button" role="tab" aria-controls="information"
                        aria-selected="true">Information</button>
                </li>
            </ul>
            <div class="tab-content" id="myTabContent">
                <div class="tab-pane fade show active" id="information" role="tabpanel"
                    aria-labelledby="information-tab">
                    <div class="d-flex justify-content-around my-3">
                        <span>
                            <b>Payment Terms:</b> {{ offer.payment_terms }}
                        </span>
                        <span>
                            <b>Validation Terms:</b> {{ offer.validation_terms }}
                        </span>
                    </div>
                    <!-- <div>
                        <h5>Description</h5>
                        <div v-html="offer.description"></div>
                    </div> -->
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { defineComponent, reactive, ref, onMounted, computed, watch } from 'vue';

    let props = defineProps({
        offer: Object,
        redirectUrl: String
    });
</script>
