export default `
<div v-if="saleSheetVisible" class="bottom-sheet-overlay" :class="{ active: saleSheetActive }" @click="closeSaleSheet">
    <div class="bottom-sheet" @click.stop>
        <div class="sheet-handle" @click="closeSaleSheet"><div class="handle-bar"></div></div>
        <div class="sheet-title">
            <div class="title-left"><i class="fas fa-arrow-up title-icon"></i><span class="title-prefix">出库·</span><span class="title-product">{{ currentProduct?.sku }} {{ currentProduct?.name }}</span></div>
            <button class="select-customer-btn" @click.stop="openCustomerSelector"><i class="fas fa-user-friends"></i><span class="selected-customer-name">{{ selectedCustomer ? (selectedCustomer.name.length > 4 ? selectedCustomer.name.slice(0,4)+'…' : selectedCustomer.name) : '选择客户' }}</span></button>
        </div>
        <div class="sheet-scrollable">
            <div v-for="(color, idx) in currentProduct?.colors" :key="color.name" class="color-block">
                <div class="color-header">
                    <span class="color-name">{{ color.name }}</span>
                    <div v-if="idx === 0" class="global-price-area"><span class="price-symbol">¥</span><input type="number" v-model.number="saleUnitPrice" class="price-input" step="1" min="0" placeholder="销售单价"><button class="icon-btn" @click="openPricePresetModal">{{ presetButtonLabel }}</button></div>
                    <div class="color-stats"><span class="color-stock">库存 {{ getColorTotal(color) }}</span><span class="color-total-count sale">出 {{ getColorTotalSale(color.name) }}</span></div>
                </div>
                <div class="size-grid">
                    <div v-for="digit in parseSizeRange(color.sizeRange)" :key="digit" class="size-input-item">
                        <div class="size-left" @click="adjustQuantity(color.name, digit, -1)">{{ digit }}码</div>
                        <input type="number" v-model.number="tempSaleData[color.name][digit]" class="size-input" min="0" :max="getStockForColor(color, digit)" step="1" @input="validateQuantity(color.name, digit)">
                        <div class="size-right sale" @click="adjustQuantity(color.name, digit, 1)">余 {{ getStockForColor(color, digit) - (tempSaleData[color.name][digit] || 0) }}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="sheet-footer">
            <details class="action-panel">
                <summary><div class="summary-left">快捷操作</div><div class="summary-right" v-if="saleTotalQuantity > 0">共 {{ saleTotalQuantity }} 双 | 总价 ¥{{ saleTotalAmount }}</div></summary>
                <div class="action-buttons"><button class="action-btn" @click="fillMaxSale">全选最大</button><button class="action-btn" @click="clearSale" :disabled="saleTotalQuantity === 0">清空</button><button class="action-btn" @click="openPackingModal">配箱</button></div>
            </details>
            <button class="btn-primary" @click="submitDirectSale">确认出库（待付款）</button>
            <button class="btn-secondary" @click="submitDraftOrder">挂起工单</button>
        </div>
    </div>
</div>
`;