export default `
<div v-if="packingModalVisible" class="modal-center" :class="{ active: packingModalActive }" @click="closePackingModal">
    <div class="modal-card" @click.stop style="max-width: 480px;">
        <div class="modal-header" style="padding: 12px 16px;"><span style="font-size: 16px;">智能配箱</span><div style="display: flex; align-items: center; gap: 12px;"><input type="text" inputmode="numeric" v-model="packingBoxSizeInput" class="packing-box-input" :class="{ 'has-value': packingBoxSizeInput && packingBoxSizeInput.trim() !== '' }" placeholder="默认30配" @input="onPackingBoxSizeInput" @blur="onPackingBoxSizeBlur"><span style="cursor:pointer; font-size: 20px;" @click="closePackingModal">✕</span></div></div>
        <div class="modal-body" style="padding: 8px 16px;">
            <div v-for="color in currentProduct?.colors" :key="color.name" class="packing-color-section">
                <div class="packing-color-title"><span>{{ color.name }}</span><span class="fold-symbol" @click.stop="toggleFold(color.name)">{{ foldState[color.name] ? '−' : '+' }}</span></div>
                <div v-show="foldState[color.name] !== false">
                    <div v-if="packingResults[color.name] && packingResults[color.name].length">
                        <div v-for="(scheme, idx) in packingResults[color.name]" :key="idx" class="packing-scheme">
                            <div class="scheme-detail">
                                <template v-for="(val, size) in scheme.allocation" :key="size"><span class="scheme-size-item">{{ size }}<span class="slash">/</span><span class="count">{{ val }}</span></span></template>
                            </div>
                            <div class="scheme-actions">
                                <div class="scheme-count-box">
                                    <button @click="decrementSchemeCount(color.name, idx)">−</button>
                                    <div class="count-display"><span class="selected-number">{{ scheme.selectedCount }}</span><span class="slash-total">/</span><span class="total-number">{{ scheme.count }}</span></div>
                                    <button @click="incrementSchemeCount(color.name, idx)">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="empty-tip" style="padding: 12px;">无可用配箱方案</div>
                </div>
            </div>
        </div>
        <div class="modal-footer"><button class="btn-confirm" @click="applyAllPacking">应用方案</button><button class="btn-cancel" @click="closePackingModal">取消</button></div>
    </div>
</div>
`;