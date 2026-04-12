import { ref, computed, nextTick } from 'vue';
import { utils } from '../utils.js';
import { dbService } from '../db.js';

export function useInventoryOperations(state, productData, feedback) {
    const baseStockMap = ref({});
    
    function getBaseKey(colorName, size) { return `${colorName}|${size}`; }
    function setBaseValue(colorName, size, value) { baseStockMap.value[getBaseKey(colorName, size)] = value; }
    function getBaseValue(colorName, size) { return baseStockMap.value[getBaseKey(colorName, size)]; }
    function resetBaseValue(colorName, size) { delete baseStockMap.value[getBaseKey(colorName, size)]; }
    
    const saleTotalQuantity = computed(() => {
        let total = 0;
        for (let color in state.tempSaleData.value) for (let size in state.tempSaleData.value[color]) total += state.tempSaleData.value[color][size] || 0;
        return total;
    });
    const saleTotalAmount = computed(() => saleTotalQuantity.value * (state.saleUnitPrice.value || 0));
    
    function getColorTotalSale(colorName) {
        if (!state.tempSaleData.value[colorName]) return 0;
        return Object.values(state.tempSaleData.value[colorName]).reduce((a,b)=>a+(b||0),0);
    }
    function adjustQuantity(colorName, size, delta) {
        const current = state.tempSaleData.value[colorName][size] || 0;
        const stock = utils.getStockForColor(state.currentProduct.value.colors.find(c => c.name === colorName), size);
        let newVal = current + delta;
        if (newVal < 0) newVal = 0;
        if (delta > 0 && newVal > stock) newVal = stock;
        state.tempSaleData.value[colorName][size] = newVal;
    }
    function validateQuantity(colorName, size) {
        let val = state.tempSaleData.value[colorName][size];
        const stock = utils.getStockForColor(state.currentProduct.value.colors.find(c => c.name === colorName), size);
        if (val < 0) val = 0;
        if (val > stock) val = stock;
        if (isNaN(val)) val = 0;
        state.tempSaleData.value[colorName][size] = val;
    }
    function fillMaxSale() {
        for (let color of state.currentProduct.value.colors) {
            utils.parseSizeRange(color.sizeRange).forEach(d => state.tempSaleData.value[color.name][d] = utils.getStockForColor(color, d));
        }
    }
    function clearSale() {
        for (let color of state.currentProduct.value.colors) {
            utils.parseSizeRange(color.sizeRange).forEach(d => state.tempSaleData.value[color.name][d] = 0);
        }
    }
    
    const stockInTotalQuantity = computed(() => {
        let total = 0;
        for (let color in state.tempStockInData.value) for (let size in state.tempStockInData.value[color]) total += state.tempStockInData.value[color][size] || 0;
        return total;
    });
    const currentTotalStock = computed(() => state.currentProduct.value ? utils.getProductTotalStock(state.currentProduct.value) : 0);
    
    function getColorTotalStockIn(colorName) {
        if (!state.tempStockInData.value[colorName]) return 0;
        return Object.values(state.tempStockInData.value[colorName]).reduce((a,b)=>a+(b||0),0);
    }
    function adjustStockInQuantity(colorName, size, delta) {
        const current = state.tempStockInData.value[colorName][size] || 0;
        let newVal = current + delta;
        if (newVal < 0) newVal = 0;
        state.tempStockInData.value[colorName][size] = newVal;
        resetBaseValue(colorName, size);
    }
    function validateStockInQuantity(colorName, size) {
        let val = state.tempStockInData.value[colorName][size];
        if (val < 0) val = 0;
        if (isNaN(val)) val = 0;
        state.tempStockInData.value[colorName][size] = val;
        resetBaseValue(colorName, size);
    }
    function clearStockIn() {
        for (let color of state.currentProduct.value.colors) {
            utils.parseSizeRange(color.sizeRange).forEach(d => {
                state.tempStockInData.value[color.name][d] = 0;
                resetBaseValue(color.name, d);
            });
        }
    }
    function batchMultiply(factor) {
        if (stockInTotalQuantity.value === 0) return;
        for (let color of state.currentProduct.value.colors) {
            const digits = utils.parseSizeRange(color.sizeRange);
            for (let digit of digits) {
                const cur = state.tempStockInData.value[color.name][digit] || 0;
                if (cur === 0) continue;
                let base = getBaseValue(color.name, digit);
                if (base === undefined) { base = cur; setBaseValue(color.name, digit, base); }
                let newVal = factor === 2 ? cur + base : cur - base;
                if (newVal < 0) newVal = 0;
                state.tempStockInData.value[color.name][digit] = newVal;
                if (newVal === 0) resetBaseValue(color.name, digit);
            }
        }
    }
    
    function parseSizeTokens(line) {
        if (!line || line.trim() === '') return [];
        let cleaned = line.replace(/[、，,]/g, ' ').replace(/\s+/g, ' ').trim();
        const tokens = cleaned.split(' ');
        const sizes = [];
        for (let token of tokens) {
            if (token.includes('-')) {
                const [s, e] = token.split('-').map(Number);
                if (!isNaN(s) && !isNaN(e)) for (let i = s; i <= e; i++) sizes.push(i);
            } else {
                const num = parseInt(token, 10);
                if (!isNaN(num)) sizes.push(num);
            }
        }
        return sizes;
    }
    function parseQuantityTokens(line) {
        if (!line || line.trim() === '') return [];
        let cleaned = line.replace(/[、，,]/g, ' ').replace(/\s+/g, ' ').trim();
        return cleaned.split(' ').map(v => parseInt(v, 10)).filter(v => !isNaN(v));
    }
    function applyBatch() {
        const text = state.batchPattern.value.trim();
        if (!text) { feedback.showToast('请输入批量规则'); return; }
        const colors = state.currentProduct.value?.colors;
        if (!colors || colors.length === 0) { feedback.showToast('当前商品无颜色数据'); return; }
        const lines = text.split('\n').map(l => l.trim());
        let colorIdx = 0, appliedCount = 0;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line === '') continue;
            while (line.startsWith('#')) { colorIdx++; line = line.substring(1).trim(); if (line === '') break; }
            if (line === '') continue;
            if (colorIdx >= colors.length) break;
            const color = colors[colorIdx];
            if (line.startsWith('*')) {
                let qtyLine = line.substring(1).trim();
                let quantities;
                if (qtyLine !== '') quantities = parseQuantityTokens(qtyLine);
                else { i++; while (i < lines.length && lines[i] === '') i++; if (i >= lines.length) break; quantities = parseQuantityTokens(lines[i]); }
                const defaultSizes = utils.parseSizeRange(color.sizeRange).map(d => {
                    const fullSize = Object.keys(color.stockMap).find(k => parseInt(k) === d);
                    return fullSize ? parseInt(fullSize) : d;
                });
                if (quantities.length === defaultSizes.length) {
                    for (let j = 0; j < defaultSizes.length; j++) {
                        const sizeKey = defaultSizes[j] % 10;
                        state.tempStockInData.value[color.name][sizeKey] = quantities[j];
                        resetBaseValue(color.name, sizeKey);
                    }
                    appliedCount++;
                } else feedback.showToast(`颜色${color.name}默认尺码数量(${defaultSizes.length})与输入(${quantities.length})不匹配`);
                colorIdx++; continue;
            }
            const sizeLine = line;
            i++; while (i < lines.length && lines[i] === '') i++;
            if (i >= lines.length) break;
            const qtyLine = lines[i];
            const sizes = parseSizeTokens(sizeLine);
            const quantities = parseQuantityTokens(qtyLine);
            if (sizes.length === 0 || quantities.length === 0) { colorIdx++; continue; }
            if (sizes.length !== quantities.length) { feedback.showToast(`颜色${color.name}码数数量(${sizes.length})与输入(${quantities.length})不匹配`); colorIdx++; continue; }
            for (let j = 0; j < sizes.length; j++) {
                const fullSize = sizes[j];
                const sizeKey = fullSize % 10;
                if (color.stockMap.hasOwnProperty(sizeKey)) {
                    state.tempStockInData.value[color.name][sizeKey] = quantities[j];
                    resetBaseValue(color.name, sizeKey);
                }
            }
            appliedCount++; colorIdx++;
        }
        state.batchModalActive.value = false;
        setTimeout(() => state.batchModalVisible.value = false, 200);
        feedback.showToast(`已应用 ${appliedCount} 组批量入库`);
    }
    
    function generatePackingResults() {
        if (!state.currentProduct.value) return;
        const results = {};
        for (let color of state.currentProduct.value.colors) {
            const digits = utils.parseSizeRange(color.sizeRange);
            const stockMap = {};
            for (let digit of digits) {
                const stock = utils.getStockForColor(color, digit);
                const selected = state.tempSaleData.value[color.name]?.[digit] || 0;
                const available = stock - selected;
                if (available > 0) stockMap[digit] = available;
            }
            const schemes = utils.calculatePackingSchemes(stockMap, state.packingBoxSize.value);
            results[color.name] = schemes.map(scheme => ({ allocation: scheme.allocation, selectedCount: 0, count: scheme.count }));
        }
        state.packingResults.value = results;
    }
    function onPackingBoxSizeInput() {
        const val = state.packingBoxSizeInput.value.trim();
        if (val === '') state.packingBoxSize.value = 30;
        else {
            const num = parseInt(val, 10);
            if (!isNaN(num) && num > 0) state.packingBoxSize.value = Math.min(num, 999);
        }
        generatePackingResults();
    }
    function onPackingBoxSizeBlur() { if (state.packingBoxSizeInput.value.trim() === '') state.packingBoxSizeInput.value = ''; }
    function openPackingModal() {
        if (!state.currentProduct.value) return;
        state.foldState.value = {};
        state.currentProduct.value.colors.forEach(c => { state.foldState.value[c.name] = true; });
        state.packingBoxSize.value = 30;
        state.packingBoxSizeInput.value = '';
        generatePackingResults();
        state.packingModalVisible.value = true;
        nextTick(() => state.packingModalActive.value = true);
    }
    function closePackingModal() {
        state.packingModalActive.value = false;
        setTimeout(() => state.packingModalVisible.value = false, 200);
    }
    function toggleFold(colorName) { state.foldState.value[colorName] = !state.foldState.value[colorName]; }
    function incrementSchemeCount(colorName, idx) {
        const scheme = state.packingResults.value[colorName][idx];
        if (scheme.selectedCount < scheme.count) scheme.selectedCount++;
    }
    function decrementSchemeCount(colorName, idx) {
        const scheme = state.packingResults.value[colorName][idx];
        if (scheme.selectedCount > 0) scheme.selectedCount--;
    }
    function applySchemeToColor(colorName, idx) {
        const scheme = state.packingResults.value[colorName][idx];
        const selectedCount = scheme.selectedCount;
        if (selectedCount === 0) return;
        for (let size in scheme.allocation) {
            const addQty = scheme.allocation[size] * selectedCount;
            const current = state.tempSaleData.value[colorName]?.[size] || 0;
            const maxStock = utils.getStockForColor(state.currentProduct.value.colors.find(c => c.name === colorName), parseInt(size));
            let newVal = current + addQty;
            if (newVal > maxStock) newVal = maxStock;
            state.tempSaleData.value[colorName][size] = newVal;
        }
        scheme.selectedCount = 0;
    }
    function applyAllPacking() {
        for (let colorName in state.packingResults.value) {
            for (let idx = 0; idx < state.packingResults.value[colorName].length; idx++) applySchemeToColor(colorName, idx);
        }
        closePackingModal();
    }
    
    const previewNewAvgCost = computed(() => {
        if (!state.currentProduct.value) return 0;
        const qty = stockInTotalQuantity.value;
        if (qty === 0) return state.currentProduct.value.costPrice || 0;
        let unitPrice = state.tempInUnitPriceNum.value, totalCost = state.tempInTotalCostNum.value;
        if (unitPrice > 0 && totalCost === 0) totalCost = unitPrice * qty;
        else if (totalCost > 0 && unitPrice === 0) unitPrice = totalCost / qty;
        if (totalCost === 0 && unitPrice === 0) return state.currentProduct.value.costPrice || 0;
        const oldQty = currentTotalStock.value, oldCost = state.currentProduct.value.costPrice || 0, oldTotal = oldQty * oldCost;
        const newTotal = oldTotal + totalCost, newQty = oldQty + qty;
        return newQty > 0 ? newTotal / newQty : oldCost;
    });
    const previewNewPriceClass = computed(() => {
        const oldCost = state.currentProduct.value?.costPrice || 0;
        if (previewNewAvgCost.value > oldCost) return 'up';
        if (previewNewAvgCost.value < oldCost) return 'down';
        return '';
    });
    
    function updateTempNumbers() {
        state.tempInUnitPriceNum.value = parseFloat(state.tempInUnitPriceStr.value) || 0;
        state.tempInTotalCostNum.value = parseFloat(state.tempInTotalCostStr.value) || 0;
    }
    function onTempUnitPriceInput() {
        updateTempNumbers();
        if (state.tempInUnitPriceNum.value > 0 && stockInTotalQuantity.value > 0) {
            const newTotal = state.tempInUnitPriceNum.value * stockInTotalQuantity.value;
            state.tempInTotalCostStr.value = newTotal.toFixed(2);
            updateTempNumbers();
            state.inUnitPrice.value = state.tempInUnitPriceNum.value;
            state.inTotalCost.value = newTotal;
        }
    }
    function onTempTotalCostInput() {
        updateTempNumbers();
        if (state.tempInTotalCostNum.value > 0 && stockInTotalQuantity.value > 0) {
            const newUnit = state.tempInTotalCostNum.value / stockInTotalQuantity.value;
            state.tempInUnitPriceStr.value = newUnit.toFixed(2);
            updateTempNumbers();
            state.inUnitPrice.value = newUnit;
            state.inTotalCost.value = state.tempInTotalCostNum.value;
        }
    }
    function confirmCostSetting() {
        state.inUnitPrice.value = state.tempInUnitPriceNum.value;
        state.inTotalCost.value = state.tempInTotalCostNum.value;
        state.costSettingModalActive.value = false;
        setTimeout(() => state.costSettingModalVisible.value = false, 200);
    }
    
    async function submitDirectSale(loadProductsFn, refreshOrdersFn) {
        let hasAny = false;
        for (let color in state.tempSaleData.value) if (Object.values(state.tempSaleData.value[color]).some(v => v > 0)) { hasAny = true; break; }
        if (!hasAny) { feedback.showToast('请至少选择一种尺码'); return; }
        if (state.saleUnitPrice.value <= 0) { feedback.showToast('请输入销售单价'); return; }
        const customerId = state.selectedCustomer.value ? state.selectedCustomer.value.id : null;
        const customerName = state.selectedCustomer.value ? state.selectedCustomer.value.name : '';
        const customerPhone = state.selectedCustomer.value ? state.selectedCustomer.value.phone : '';
        const items = [];
        for (let colorName in state.tempSaleData.value) {
            for (let sizeStr in state.tempSaleData.value[colorName]) {
                const qty = state.tempSaleData.value[colorName][sizeStr];
                if (qty > 0) items.push({
                    productId: state.currentProduct.value.id, sku: state.currentProduct.value.sku, productName: state.currentProduct.value.name,
                    colorName, size: parseInt(sizeStr), quantity: qty, unit_price: state.saleUnitPrice.value
                });
            }
        }
        for (let item of items) {
            const product = productData.productList.value.find(p => p.id === item.productId);
            const color = product.colors.find(c => c.name === item.colorName);
            if ((color.stockMap[item.size] || 0) < item.quantity) { feedback.showToast(`${product.sku} ${item.colorName} ${item.size}码 库存不足`); return; }
        }
        const orderNo = 'OUT' + Date.now();
        for (let item of items) {
            await dbService.updateProductStockAndCost(item.productId, [{ colorName: item.colorName, size: item.size, delta: -item.quantity }], 0, 0);
            await dbService.addInventoryLog(1, item.productId, item.sku, item.colorName, item.size, -item.quantity, null, 'sale', orderNo, 'order', 'admin', '销售出库');
        }
        await dbService.saveOrder(orderNo, 1, customerId, customerName, customerPhone, items, 'pending_payment');
        feedback.showToast(`出库单 ${orderNo} 已创建`);
        await loadProductsFn(); await refreshOrdersFn();
        state.saleSheetActive.value = false; setTimeout(() => state.saleSheetVisible.value = false, 350);
    }
    
    async function submitDraftOrder(refreshOrdersFn) {
        let hasAny = false;
        for (let color in state.tempSaleData.value) if (Object.values(state.tempSaleData.value[color]).some(v => v > 0)) { hasAny = true; break; }
        if (!hasAny) { feedback.showToast('请至少选择一种尺码'); return; }
        const customerId = state.selectedCustomer.value ? state.selectedCustomer.value.id : null;
        const customerName = state.selectedCustomer.value ? state.selectedCustomer.value.name : '';
        const customerPhone = state.selectedCustomer.value ? state.selectedCustomer.value.phone : '';
        const items = [];
        for (let colorName in state.tempSaleData.value) {
            for (let sizeStr in state.tempSaleData.value[colorName]) {
                const qty = state.tempSaleData.value[colorName][sizeStr];
                if (qty > 0) items.push({
                    productId: state.currentProduct.value.id, sku: state.currentProduct.value.sku, productName: state.currentProduct.value.name,
                    colorName, size: parseInt(sizeStr), quantity: qty, unit_price: state.saleUnitPrice.value
                });
            }
        }
        const orderNo = 'DRAFT' + Date.now();
        await dbService.saveOrder(orderNo, 1, customerId, customerName, customerPhone, items, 'draft');
        feedback.showToast(`工单 ${orderNo} 已挂起`);
        await refreshOrdersFn();
        clearSale();
    }
    
    async function submitStockIn(loadProductsFn) {
        let hasAny = false;
        for (let color in state.tempStockInData.value) if (Object.values(state.tempStockInData.value[color]).some(v => v > 0)) { hasAny = true; break; }
        if (!hasAny) { feedback.showToast('请至少选择一种尺码'); return; }
        const totalCost = state.inTotalCost.value;
        const hasPrice = (state.inUnitPrice.value > 0 || totalCost > 0);
        const itemsDelta = [];
        for (let colorName in state.tempStockInData.value) {
            for (let sizeStr in state.tempStockInData.value[colorName]) {
                const qty = state.tempStockInData.value[colorName][sizeStr];
                if (qty > 0) itemsDelta.push({ colorName, size: parseInt(sizeStr), delta: qty });
            }
        }
        const batchNo = 'IN' + Date.now();
        if (hasPrice) {
            const finalTotalCost = totalCost > 0 ? totalCost : (state.inUnitPrice.value * stockInTotalQuantity.value);
            const oldQty = currentTotalStock.value, oldCost = state.currentProduct.value.costPrice || 0, oldTotal = oldQty * oldCost;
            const finalAvg = (oldTotal + finalTotalCost) / (oldQty + stockInTotalQuantity.value);
            const finalAvgRounded = parseFloat(finalAvg.toFixed(2));
            await dbService.updateProductStockAndCost(state.currentProduct.value.id, itemsDelta, stockInTotalQuantity.value, finalTotalCost, finalAvgRounded);
            feedback.showToast(`入库完成！新成本均价: ¥${finalAvgRounded.toFixed(2)}`);
        } else {
            await dbService.updateProductStockAndCost(state.currentProduct.value.id, itemsDelta, stockInTotalQuantity.value, 0, null);
            feedback.showToast(`入库完成！库存增加 ${stockInTotalQuantity.value} 双`);
        }
        for (let item of itemsDelta) {
            await dbService.addInventoryLog(1, state.currentProduct.value.id, state.currentProduct.value.sku, item.colorName, item.size, item.delta, hasPrice ? state.inUnitPrice.value : null, 'purchase', batchNo, 'purchase_order', 'admin', '采购入库');
        }
        await loadProductsFn();
        state.stockInSheetActive.value = false; setTimeout(() => state.stockInSheetVisible.value = false, 350);
    }
    
    return {
        baseStockMap, saleTotalQuantity, saleTotalAmount, getColorTotalSale,
        adjustQuantity, validateQuantity, fillMaxSale, clearSale,
        stockInTotalQuantity, currentTotalStock, getColorTotalStockIn,
        adjustStockInQuantity, validateStockInQuantity, clearStockIn, batchMultiply,
        parseSizeTokens, parseQuantityTokens, applyBatch,
        generatePackingResults, onPackingBoxSizeInput, onPackingBoxSizeBlur, openPackingModal, closePackingModal,
        toggleFold, incrementSchemeCount, decrementSchemeCount, applyAllPacking,
        previewNewAvgCost, previewNewPriceClass, updateTempNumbers, onTempUnitPriceInput, onTempTotalCostInput, confirmCostSetting,
        submitDirectSale, submitDraftOrder, submitStockIn,
    };
}