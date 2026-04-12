export const StockInSheet = {
    props: ['visible', 'active', 'currentProduct', 'tempStockInData', 'stockInTotalQuantity'],
    emits: ['close', 'openCostSettingModal', 'adjustStockInQuantity', 'validateStockInQuantity', 'batchMultiply', 'clearStockIn', 'openBatchModal', 'submitStockIn', 'getColorTotal', 'getColorTotalStockIn', 'parseSizeRange', 'getStockForColor'],
    template: `
        <div v-if="visible" class="bottom-sheet-overlay" :class="{ active: active }" @click="$emit('close')">
            <div class="bottom-sheet" @click.stop>
                <div class="sheet-handle" @click="$emit('close')"><div class="handle-bar"></div></div>
                <div class="sheet-title">
                    <div class="title-left"><i class="fas fa-arrow-down" style="color:#2ecc71"></i><span class="title-prefix">入库·</span><span class="title-product">{{ currentProduct?.sku }} {{ currentProduct?.name }}</span></div>
                </div>
                <div class="sheet-scrollable">
                    <div v-for="(color, idx) in currentProduct?.colors" :key="color.name" class="color-block">
                        <div class="color-header">
                            <span class="color-name">{{ color.name }}</span>
                            <div v-if="idx === 0" class="global-price-area">
                                <button class="icon-btn" @click="$emit('openCostSettingModal')">入库价格（可选）</button>
                            </div>
                            <div class="color-stats">
                                <span class="color-stock">库存 {{ $emit('getColorTotal', color) }}</span>
                                <span class="color-total-count in">入 {{ $emit('getColorTotalStockIn', color.name) }}</span>
                            </div>
                        </div>
                        <div class="size-grid">
                            <div v-for="digit in $emit('parseSizeRange', color.sizeRange)" :key="digit" class="size-input-item">
                                <div class="size-left" @click="$emit('adjustStockInQuantity', color.name, digit, -1)">{{ digit }}码</div>
                                <input type="number" v-model.number="tempStockInData[color.name][digit]" class="size-input" min="0" step="1" @input="$emit('validateStockInQuantity', color.name, digit)">
                                <div class="size-right in" @click="$emit('adjustStockInQuantity', color.name, digit, 1)">现 {{ $emit('getStockForColor', color, digit) + (tempStockInData[color.name][digit] || 0) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="sheet-footer">
                    <details class="action-panel">
                        <summary><div class="summary-left">快捷操作</div><div class="summary-right" v-if="stockInTotalQuantity > 0">共 {{ stockInTotalQuantity }} 双</div></summary>
                        <div class="action-buttons">
                            <button class="action-btn" @click="$emit('batchMultiply', 0.5)" :disabled="stockInTotalQuantity === 0">倍减</button>
                            <span class="action-divider"></span>
                            <button class="action-btn" @click="$emit('batchMultiply', 2)" :disabled="stockInTotalQuantity === 0">倍增</button>
                            <button class="action-btn" @click="$emit('clearStockIn')" :disabled="stockInTotalQuantity === 0">清空</button>
                            <button class="action-btn" @click="$emit('openBatchModal')">批量</button>
                        </div>
                    </details>
                    <button class="btn-primary" @click="$emit('submitStockIn')">确认入库</button>
                </div>
            </div>
        </div>
    `
};