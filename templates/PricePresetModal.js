export default `
<div v-if="pricePresetModalVisible" class="modal-center" :class="{ active: pricePresetModalActive }" @click="closePricePresetModal">
    <div class="modal-card" @click.stop>
        <div class="modal-header"><span>选择销售价格</span><span style="cursor:pointer" @click="closePricePresetModal">✕</span></div>
        <div class="modal-body">
            <div class="price-option" @click="selectPresetPrice('retail')"><span>零售价</span><span>¥{{ currentProduct?.salePrices?.retail || 299 }}</span></div>
            <div class="price-option" @click="selectPresetPrice('wholesale')"><span>批发价</span><span>¥{{ currentProduct?.salePrices?.wholesale || 168 }}</span></div>
            <div class="price-option" @click="selectPresetPrice('discount')"><span>折扣价</span><span>¥{{ currentProduct?.salePrices?.discount || 239 }}</span></div>
        </div>
    </div>
</div>
`;