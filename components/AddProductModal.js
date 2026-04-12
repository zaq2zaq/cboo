export const AddProductModal = {
    props: ['visible', 'active', 'newProduct'],
    emits: ['close', 'update:newProduct', 'saveProduct'],
    template: `
        <div v-if="visible" class="modal-center" :class="{ active: active }" @click="$emit('close')">
            <div class="modal-card" @click.stop style="max-width: 420px;">
                <div class="modal-header"><span>添加商品</span><span style="cursor:pointer" @click="$emit('close')">✕</span></div>
                <div class="modal-body">
                    <div class="form-group"><label class="form-label">货号 SKU</label><input class="form-input" :value="newProduct.sku" @input="$emit('update:newProduct', { ...newProduct, sku: $event.target.value })" placeholder="如 XB-2401"></div>
                    <div class="form-group"><label class="form-label">商品名称</label><input class="form-input" :value="newProduct.name" @input="$emit('update:newProduct', { ...newProduct, name: $event.target.value })" placeholder="如 法式乐福鞋"></div>
                    <div class="form-group"><label class="form-label">标签 (逗号分隔)</label><input class="form-input" :value="newProduct.tags" @input="$emit('update:newProduct', { ...newProduct, tags: $event.target.value })" placeholder="头层牛皮,手工缝线"></div>
                    <div class="form-group"><label class="form-label">尺码范围</label><input class="form-input" :value="newProduct.sizeRange" @input="$emit('update:newProduct', { ...newProduct, sizeRange: $event.target.value })" placeholder="34-39"></div>
                    <div class="form-group"><label class="form-label">成本价 (¥)</label><input class="form-input" type="number" :value="newProduct.costPrice" @input="$emit('update:newProduct', { ...newProduct, costPrice: $event.target.value })"></div>
                    <div class="form-group"><label class="form-label">零售价 (¥)</label><input class="form-input" type="number" :value="newProduct.salePrices.retail" @input="$emit('update:newProduct', { ...newProduct, salePrices: { ...newProduct.salePrices, retail: $event.target.value } })"></div>
                    <div class="form-group"><label class="form-label">批发价 (¥)</label><input class="form-input" type="number" :value="newProduct.salePrices.wholesale" @input="$emit('update:newProduct', { ...newProduct, salePrices: { ...newProduct.salePrices, wholesale: $event.target.value } })"></div>
                    <div class="form-group"><label class="form-label">折扣价 (¥)</label><input class="form-input" type="number" :value="newProduct.salePrices.discount" @input="$emit('update:newProduct', { ...newProduct, salePrices: { ...newProduct.salePrices, discount: $event.target.value } })"></div>
                </div>
                <div class="modal-footer"><button class="btn-confirm" @click="$emit('saveProduct')">保存</button><button class="btn-cancel" @click="$emit('close')">取消</button></div>
            </div>
        </div>
    `
};