export const PricePresetModal = {
    props: ['visible', 'active', 'currentProduct'],
    emits: ['close', 'selectPresetPrice'],
    template: `
        <div v-if="visible" class="modal-center" :class="{ active: active }" @click="$emit('close')">
            <div class="modal-card" @click.stop>
                <div class="modal-header"><span>选择销售价格</span><span style="cursor:pointer" @click="$emit('close')">✕</span></div>
                <div class="modal-body">
                    <div class="price-option" @click="$emit('selectPresetPrice', 'retail')"><span>零售价</span><span>¥{{ currentProduct?.salePrices?.retail || 299 }}</span></div>
                    <div class="price-option" @click="$emit('selectPresetPrice', 'wholesale')"><span>批发价</span><span>¥{{ currentProduct?.salePrices?.wholesale || 168 }}</span></div>
                    <div class="price-option" @click="$emit('selectPresetPrice', 'discount')"><span>折扣价</span><span>¥{{ currentProduct?.salePrices?.discount || 239 }}</span></div>
                </div>
            </div>
        </div>
    `
};