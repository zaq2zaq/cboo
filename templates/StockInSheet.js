export default `
<div v-if="stockInSheetVisible" class="bottom-sheet-overlay" :class="{ active: stockInSheetActive }" @click="closeStockInSheet">
    <div class="bottom-sheet" @click.stop>
        <div class="sheet-handle" @click="closeStockInSheet"><div class="handle-bar"></div></div>
        <div class="sheet-title"><div class="title-left"><i class="fas fa-arrow-down" style="color:#2ecc71"></i><span class="title-prefix">入库·</span><span class="title-product">{{ currentProduct?.sku }} {{ currentProduct?.name }}</span></div></div>
        <div class="sheet-scrollable">
            <div v-for="(color, idx) in currentProduct?.colors" :key="color.name" class="color-block">
                <div class="color-header">
                    <span class="color-name">{{ color.name }}</span>
                    <div v-if="idx === 0" class="global-price-area"><button class="icon-btn" @click="openCostSettingModal">入库价格（可选）</button></div>
                    <div class="color-stats"><span class="color-stock">库存 {{ getColorTotal(color) }}</span><span class="color-total-count in">入 {{ getColorTotalStockIn(color.name) }}</span></div>
                </div>
                <div class="size-grid">
                    <div v-for="digit in parseSizeRange(color.sizeRange)" :key="digit" class="size-input-item">
                        <div class="size-left" @click="adjustStockInQuantity(color.name, digit, -1)">{{ digit }}码</div>
                        <input type="number" v-model.number="tempStockInData[color.name][digit]" class="size-input" min="0" step="1" @input="validateStockInQuantity(color.name, digit)">
                        <div class="size-right in" @click="adjustStockInQuantity(color.name, digit, 1)">现 {{ getStockForColor(color, digit) + (tempStockInData[color.name][digit] || 0) }}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="sheet-footer">
            <details class="action-panel">
                <summary><div class="summary-left">快捷操作</div><div class="summary-right" v-if="stockInTotalQuantity > 0">共 {{ stockInTotalQuantity }} 双</div></summary>
                <div class="action-buttons"><button class="action-btn" @click="batchMultiply(0.5)" :disabled="stockInTotalQuantity === 0">倍减</button><span class="action-divider"></span><button class="action-btn" @click="batchMultiply(2)" :disabled="stockInTotalQuantity === 0">倍增</button><button class="action-btn" @click="clearStockIn" :disabled="stockInTotalQuantity === 0">清空</button><button class="action-btn" @click="openBatchModal">批量</button></div>
            </details>
            <button class="btn-primary" @click="submitStockIn">确认入库</button>
        </div>
    </div>
</div>
`;