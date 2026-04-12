export const CostSettingModal = {
    props: ['visible', 'active', 'currentProduct', 'tempInUnitPriceStr', 'tempInTotalCostStr', 'previewNewAvgCost', 'previewNewPriceClass', 'stockInTotalQuantity', 'currentTotalStock'],
    emits: ['close', 'update:tempInUnitPriceStr', 'update:tempInTotalCostStr', 'onTempUnitPriceInput', 'onTempTotalCostInput', 'confirmCostSetting'],
    template: `
        <div v-if="visible" class="modal-center" :class="{ active: active }" @click="$emit('close')">
            <div class="modal-card" @click.stop>
                <div class="modal-header"><span>入库价格设置（可选）</span><span style="cursor:pointer" @click="$emit('close')">✕</span></div>
                <div class="modal-body">
                    <div class="cost-row">
                        <span>现库价(¥)</span>
                        <span class="cost-divider">
                            <span class="cost-old">{{ (currentProduct?.costPrice || 0).toFixed(2) }}</span>
                            <template v-if="stockInTotalQuantity > 0 && (tempInUnitPriceNum > 0 || tempInTotalCostNum > 0)">
                                <span class="cost-old"> / </span>
                                <span :class="['cost-new', previewNewPriceClass]">{{ previewNewAvgCost.toFixed(2) }}</span>
                            </template>
                        </span>
                    </div>
                    <div class="cost-row">
                        <span>入库量(双)</span>
                        <span class="cost-divider">
                            <span class="cost-old">{{ currentTotalStock }}</span>
                            <template v-if="stockInTotalQuantity > 0">
                                <span class="cost-old"> / </span>
                                <span class="cost-quantity-new">{{ stockInTotalQuantity }}</span>
                            </template>
                        </span>
                    </div>
                    <div class="cost-input-group">
                        <div class="cost-input-item"><label>入库单价(¥)</label><input type="text" :value="tempInUnitPriceStr" placeholder="不填则成本不变" @input="$emit('update:tempInUnitPriceStr', $event.target.value)"></div>
                        <div class="cost-input-item"><label>入库总价(¥)</label><input type="text" :value="tempInTotalCostStr" placeholder="不填则成本不变" @input="$emit('update:tempInTotalCostStr', $event.target.value)"></div>
                    </div>
                </div>
                <div class="modal-footer"><button class="btn-confirm" @click="$emit('confirmCostSetting')">确定</button><button class="btn-cancel" @click="$emit('close')">取消</button></div>
            </div>
        </div>
    `
};