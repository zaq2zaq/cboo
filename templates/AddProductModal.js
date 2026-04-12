export default `
<div v-if="addProductVisible" class="modal-center" :class="{ active: addProductActive }" @click="closeAddProduct">
    <div class="modal-card" @click.stop style="max-width: 420px;">
        <div class="modal-header"><span>添加商品</span><span style="cursor:pointer" @click="closeAddProduct">✕</span></div>
        <div class="modal-body">
            <div class="form-group"><label class="form-label">货号 SKU</label><input class="form-input" v-model="newProduct.sku" placeholder="如 XB-2401"></div>
            <div class="form-group"><label class="form-label">商品名称</label><input class="form-input" v-model="newProduct.name" placeholder="如 法式乐福鞋"></div>
            <div class="form-group"><label class="form-label">标签 (逗号分隔)</label><input class="form-input" v-model="newProduct.tags" placeholder="头层牛皮,手工缝线"></div>
            <div class="form-group"><label class="form-label">尺码范围</label><input class="form-input" v-model="newProduct.sizeRange" placeholder="34-39"></div>
            <div class="form-group"><label class="form-label">成本价 (¥)</label><input class="form-input" type="number" v-model.number="newProduct.costPrice"></div>
            <div class="form-group"><label class="form-label">零售价 (¥)</label><input class="form-input" type="number" v-model.number="newProduct.salePrices.retail"></div>
            <div class="form-group"><label class="form-label">批发价 (¥)</label><input class="form-input" type="number" v-model.number="newProduct.salePrices.wholesale"></div>
            <div class="form-group"><label class="form-label">折扣价 (¥)</label><input class="form-input" type="number" v-model.number="newProduct.salePrices.discount"></div>
        </div>
        <div class="modal-footer"><button class="btn-confirm" @click="saveProduct">保存</button><button class="btn-cancel" @click="closeAddProduct">取消</button></div>
    </div>
</div>
`;