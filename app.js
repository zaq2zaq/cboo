import { createApp, ref, onMounted, onUnmounted, computed, nextTick, provide, watch } from 'vue';
import { utils } from './utils.js';
import { dbService } from './db.js';
import { AppHeader, ProductList, SearchPanel } from './components.js';

// ========== Composition API 函数 ==========

// 商品数据与筛选逻辑
function useProductData() {
    const productList = ref([]);
    const searchKeyword = ref('');
    const filterType = ref('全部');
    const sortType = ref('default');
    
    const filteredProducts = computed(() => {
        let list = productList.value;
        if (searchKeyword.value) {
            const kw = searchKeyword.value.toLowerCase();
            list = list.filter(p => p.sku.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw));
        }
        if (filterType.value === '有库存') list = list.filter(p => utils.getProductTotalStock(p) > 0);
        if (filterType.value === '热销') list = list.filter(p => utils.getProductTotalStock(p) > 20);
        if (sortType.value === 'sales') list = [...list].sort((a,b) => utils.getProductTotalStock(b) - utils.getProductTotalStock(a));
        else if (sortType.value === 'price') list = [...list].sort((a,b) => (a.costPrice||0) - (b.costPrice||0));
        else if (sortType.value === 'oldest') list = [...list].sort((a,b) => (a.create_time||0) - (b.create_time||0));
        else list = [...list].sort((a,b) => (b.create_time||0) - (a.create_time||0));
        return list;
    });
    
    const filteredCount = computed(() => filteredProducts.value.length);
    const totalStockAll = computed(() => productList.value.reduce((sum,p)=>sum + utils.getProductTotalStock(p),0));
    
    async function loadProducts() {
        await dbService.open();
        productList.value = await dbService.getAllProducts();
    }
    
    function onFilterChange(val) { filterType.value = val; }
    function onSortChange(val) {
        if (val === '综合') sortType.value = 'default';
        else if (val === '销量') sortType.value = 'sales';
        else if (val === '价格') sortType.value = 'price';
        else if (val === '最早') sortType.value = 'oldest';
    }
    function onSearch(val) { searchKeyword.value = val; }
    function resetSearch() { searchKeyword.value = ''; filterType.value = '全部'; sortType.value = 'default'; }
    
    return {
        productList,
        searchKeyword,
        filterType,
        sortType,
        filteredProducts,
        filteredCount,
        totalStockAll,
        loadProducts,
        onFilterChange,
        onSortChange,
        onSearch,
        resetSearch,
    };
}

// 弹窗状态管理
function useModalState() {
    const searchActive = ref(false);
    const sidebarOpen = ref(false);
    
    const saleSheetVisible = ref(false);
    const saleSheetActive = ref(false);
    const currentProduct = ref(null);
    const tempSaleData = ref({});
    const selectedCustomer = ref(null);
    const saleUnitPrice = ref(0);
    const presetButtonLabel = ref('预设价');
    let skipPriceWatch = false;
    
    const stockInSheetVisible = ref(false);
    const stockInSheetActive = ref(false);
    const tempStockInData = ref({});
    const inUnitPrice = ref(0);
    const inTotalCost = ref(0);
    
    const orderSheetVisible = ref(false);
    const orderSheetActive = ref(false);
    const orderTab = ref('pending');
    const pendingOrders = ref([]);
    const draftOrders = ref([]);
    
    const customerSelectorVisible = ref(false);
    const customerSelectorActive = ref(false);
    const customerList = ref([]);
    const customerSearch = ref('');
    const tempSelectedCustomerId = ref(null);
    
    const addCustomerVisible = ref(false);
    const addCustomerActive = ref(false);
    const newCustomer = ref({ name: '', phone: '', address: '' });
    
    const addProductVisible = ref(false);
    const addProductActive = ref(false);
    const newProduct = ref({ sku: '', name: '', tags: '', sizeRange: '34-39', colors: [{ name: '黑色', stockMap: {} }], costPrice: 0, salePrices: { retail: 299, wholesale: 168, discount: 239 } });
    
    const pricePresetModalVisible = ref(false);
    const pricePresetModalActive = ref(false);
    
    const costSettingModalVisible = ref(false);
    const costSettingModalActive = ref(false);
    const tempInUnitPriceStr = ref('');
    const tempInTotalCostStr = ref('');
    const tempInUnitPriceNum = ref(0);
    const tempInTotalCostNum = ref(0);
    
    const batchModalVisible = ref(false);
    const batchModalActive = ref(false);
    const batchPattern = ref('');
    
    const packingModalVisible = ref(false);
    const packingModalActive = ref(false);
    const packingBoxSize = ref(30);
    const packingBoxSizeInput = ref('');
    const packingResults = ref({});
    const foldState = ref({});
    
    const confirmVisible = ref(false);
    const confirmActive = ref(false);
    const confirmTitle = ref('提示');
    const confirmMessage = ref('');
    let confirmCallback = null;
    
    const toastVisible = ref(false);
    const toastMessage = ref('');
    let toastTimer = null;
    
    function showToast(msg, duration = 2500) {
        if (toastTimer) clearTimeout(toastTimer);
        toastMessage.value = msg;
        toastVisible.value = true;
        toastTimer = setTimeout(() => { toastVisible.value = false; }, duration);
    }
    
    function showConfirm(message, title = '提示') {
        return new Promise((resolve) => {
            confirmTitle.value = title;
            confirmMessage.value = message;
            confirmVisible.value = true;
            confirmActive.value = true;
            confirmCallback = resolve;
        });
    }
    function closeConfirm() {
        confirmActive.value = false;
        setTimeout(() => { confirmVisible.value = false; }, 200);
        if (confirmCallback) confirmCallback(false);
        confirmCallback = null;
    }
    function confirmResolve(val) {
        confirmActive.value = false;
        setTimeout(() => { confirmVisible.value = false; }, 200);
        if (confirmCallback) confirmCallback(val);
        confirmCallback = null;
    }
    
    function initSaleData(product) {
        const data = {};
        for (let color of product.colors) {
            data[color.name] = {};
            utils.parseSizeRange(color.sizeRange).forEach(d => data[color.name][d] = 0);
        }
        tempSaleData.value = data;
        saleUnitPrice.value = product.salePrices?.retail || 299;
    }
    function initStockInData(product) {
        const data = {};
        for (let color of product.colors) {
            data[color.name] = {};
            utils.parseSizeRange(color.sizeRange).forEach(d => data[color.name][d] = 0);
        }
        tempStockInData.value = data;
        inUnitPrice.value = 0;
        inTotalCost.value = 0;
        tempInUnitPriceStr.value = '';
        tempInTotalCostStr.value = '';
        tempInUnitPriceNum.value = 0;
        tempInTotalCostNum.value = 0;
    }
    
    return {
        searchActive, sidebarOpen,
        saleSheetVisible, saleSheetActive, currentProduct, tempSaleData, selectedCustomer, saleUnitPrice, presetButtonLabel, skipPriceWatch,
        stockInSheetVisible, stockInSheetActive, tempStockInData, inUnitPrice, inTotalCost,
        orderSheetVisible, orderSheetActive, orderTab, pendingOrders, draftOrders,
        customerSelectorVisible, customerSelectorActive, customerList, customerSearch, tempSelectedCustomerId,
        addCustomerVisible, addCustomerActive, newCustomer,
        addProductVisible, addProductActive, newProduct,
        pricePresetModalVisible, pricePresetModalActive,
        costSettingModalVisible, costSettingModalActive, tempInUnitPriceStr, tempInTotalCostStr, tempInUnitPriceNum, tempInTotalCostNum,
        batchModalVisible, batchModalActive, batchPattern,
        packingModalVisible, packingModalActive, packingBoxSize, packingBoxSizeInput, packingResults, foldState,
        confirmVisible, confirmActive, confirmTitle, confirmMessage,
        toastVisible, toastMessage,
        showToast, showConfirm, closeConfirm, confirmResolve,
        initSaleData, initStockInData,
    };
}

// 出入库、配箱等核心业务操作
function useInventoryOperations(state, productData, feedback) {
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

// 客户与订单逻辑
function useCustomerOrder(state, productData, feedback) {
    const filteredCustomersForSelector = computed(() => {
        const search = state.customerSearch.value.trim().toLowerCase();
        if (!search) return [];
        return state.customerList.value.filter(c => c.name.toLowerCase().includes(search) || (c.phone && c.phone.includes(search)));
    });
    
    async function loadCustomers() { state.customerList.value = await dbService.getCustomers(); }
    async function refreshOrders() {
        state.pendingOrders.value = await dbService.getOrdersByStatus('pending_payment');
        state.draftOrders.value = await dbService.getOrdersByStatus('draft');
        for (let order of state.pendingOrders.value) order.items = await dbService.getOrderItems(order.id);
        for (let order of state.draftOrders.value) order.items = await dbService.getOrderItems(order.id);
    }
    function formatOrderItems(items) {
        if (!items || items.length === 0) return '';
        return items.map(i => `${i.sku} ${i.color_name} ${i.size}码 x${i.quantity}`).join('; ');
    }
    function toggleCustomerSelect(cid) { state.tempSelectedCustomerId.value = state.tempSelectedCustomerId.value === cid ? null : cid; }
    function confirmCustomerSelection() {
        if (state.tempSelectedCustomerId.value) {
            const selected = state.customerList.value.find(c => c.id === state.tempSelectedCustomerId.value);
            if (selected) state.selectedCustomer.value = selected;
        } else state.selectedCustomer.value = null;
        state.customerSelectorActive.value = false;
        setTimeout(() => state.customerSelectorVisible.value = false, 200);
    }
    function openAddCustomerFromSelector() {
        state.customerSelectorActive.value = false; setTimeout(() => state.customerSelectorVisible.value = false, 200);
        state.newCustomer.value = { name: '', phone: '', address: '' };
        state.addCustomerVisible.value = true; nextTick(() => state.addCustomerActive.value = true);
    }
    async function saveCustomer() {
        if (!state.newCustomer.value.name || !state.newCustomer.value.phone) { feedback.showToast('请填写姓名和电话'); return; }
        const newId = await dbService.addCustomer(state.newCustomer.value.name, state.newCustomer.value.phone, state.newCustomer.value.address);
        await loadCustomers();
        const newCust = state.customerList.value.find(c => c.id === newId);
        if (newCust) state.selectedCustomer.value = newCust;
        state.addCustomerActive.value = false; setTimeout(() => state.addCustomerVisible.value = false, 200);
        feedback.showToast('客户添加成功');
    }
    async function confirmDraftOrder(order) {
        const items = order.items;
        for (let item of items) {
            const product = productData.productList.value.find(p => p.id === item.product_id);
            const color = product.colors.find(c => c.name === item.color_name);
            if ((color.stockMap[item.size] || 0) < item.quantity) { feedback.showToast(`${product.sku} 库存不足`); return; }
        }
        for (let item of items) {
            await dbService.updateProductStockAndCost(item.product_id, [{ colorName: item.color_name, size: item.size, delta: -item.quantity }], 0, 0);
            await dbService.addInventoryLog(1, item.product_id, item.sku, item.color_name, item.size, -item.quantity, null, 'sale', order.order_no, 'order', 'admin', '工单确认出库');
        }
        await dbService.updateOrderStatus(order.id, 'completed');
        feedback.showToast('工单已确认出库');
        await refreshOrders(); await productData.loadProducts();
    }
    async function markOrderPaid(order) { await dbService.updateOrderStatus(order.id, 'completed'); feedback.showToast('订单已标记为已付款'); await refreshOrders(); }
    async function confirmDeleteOrder(order) {
        if (await feedback.showConfirm(`确定删除订单 ${order.order_no} 吗？`, '删除确认')) {
            await dbService.deleteOrder(order.id); await refreshOrders(); feedback.showToast('订单已删除');
        }
    }
    
    return {
        filteredCustomersForSelector, loadCustomers, refreshOrders, formatOrderItems,
        toggleCustomerSelect, confirmCustomerSelection, openAddCustomerFromSelector, saveCustomer,
        confirmDraftOrder, markOrderPaid, confirmDeleteOrder,
    };
}

// 拖拽与面板展开逻辑
function useDragAndExpand(searchActive) {
    const isExpanded = ref(false); const isDragging = ref(false); const dragOffset = ref(0);
    const blueCardMarginTop = ref(0); const container2Top = ref(0); const container2Height = ref(0);
    const scrollableRef = ref(null);
    
    const computeAndSetPosition = () => {
        const kpi = document.querySelector('.kpi-flat-row');
        if (kpi) { const rect = kpi.getBoundingClientRect(); container2Top.value = rect.bottom; let h = window.innerHeight - rect.bottom; if (h < 100) h = 100; container2Height.value = h; }
    };
    const setMarginFromOffset = (o) => { let m = Math.min(Math.max(o, 0), 180); blueCardMarginTop.value = m; dragOffset.value = o; };
    
    let ty = 0, so = 0;
    const onTouchStartDrag = (e) => { if (isExpanded.value) return; isDragging.value = true; ty = e.touches[0].clientY; so = dragOffset.value; e.preventDefault(); };
    const onTouchMoveDrag = (e) => { if (!isDragging.value || isExpanded.value) return; let d = e.touches[0].clientY - ty; let no = so + d; if (no < 0) no = 0; if (no > 180) no = 180; setMarginFromOffset(no); e.preventDefault(); };
    const onTouchEndDrag = () => { if (!isDragging.value || isExpanded.value) { isDragging.value = false; return; } isDragging.value = false; if (dragOffset.value >= 70) { isExpanded.value = true; setMarginFromOffset(180); } else { setMarginFromOffset(0); isExpanded.value = false; } computeAndSetPosition(); };
    
    let sy = 0, sso = 0, isd = false;
    const onScrollableTouchStart = (e) => { if (isExpanded.value || searchActive.value) return; if (scrollableRef.value && scrollableRef.value.scrollTop === 0) { sy = e.touches[0].clientY; sso = dragOffset.value; isd = true; isDragging.value = true; } };
    const onScrollableTouchMove = (e) => { if (!isd || isExpanded.value || searchActive.value) return; let d = e.touches[0].clientY - sy; if (d > 0 && scrollableRef.value.scrollTop === 0) { let no = sso + d; if (no < 0) no = 0; if (no > 180) no = 180; setMarginFromOffset(no); e.preventDefault(); } else { isd = false; isDragging.value = false; } };
    const onScrollableTouchEnd = () => { if (isd && !isExpanded.value && !searchActive.value) { if (dragOffset.value >= 70) { isExpanded.value = true; setMarginFromOffset(180); } else { setMarginFromOffset(0); isExpanded.value = false; } computeAndSetPosition(); } isd = false; isDragging.value = false; };
    const toggleExpand = () => { if (isExpanded.value) { isExpanded.value = false; setMarginFromOffset(0); } else { isExpanded.value = true; setMarginFromOffset(180); } computeAndSetPosition(); };
    
    const searchPanelHeight = ref(200);
    const updateSearchPanelHeight = () => { nextTick(() => { const panel = document.querySelector('.search-panel'); if (panel) searchPanelHeight.value = panel.offsetHeight; }); };
    const dynamicContainer2Top = computed(() => {
        if (searchActive.value) { const panel = document.querySelector('.search-panel'); if (panel) return panel.getBoundingClientRect().bottom; return 180; }
        return container2Top.value;
    });
    watch(searchActive, (val) => { if (val) updateSearchPanelHeight(); });
    
    return { isExpanded, isDragging, blueCardMarginTop, container2Top, container2Height, scrollableRef, onTouchStartDrag, onTouchMoveDrag, onTouchEndDrag, onScrollableTouchStart, onScrollableTouchMove, onScrollableTouchEnd, toggleExpand, computeAndSetPosition, searchPanelHeight, updateSearchPanelHeight, dynamicContainer2Top };
}

// 商品滑动交互
function useSwipeActions(productList) {
    const swipeOffset = ref({}); const swipeActionsRight = ref({}); const showDetail = ref({});
    let touchStartX = 0, currentProductId = null; const SWIPE_THRESHOLD = 50, ACTION_WIDTH = 152;
    function closeAllSwipes() { productList.value.forEach(p => { swipeOffset.value[p.id] = 0; swipeActionsRight.value[p.id] = false; }); }
    function onTouchStart(e, pid) { touchStartX = e.touches[0].clientX; currentProductId = pid; }
    function onTouchMove(e, pid) { if (currentProductId !== pid) return; const deltaX = e.touches[0].clientX - touchStartX; if (deltaX < 0) { let offset = Math.min(-deltaX, ACTION_WIDTH); if (offset < 10) offset = 0; swipeOffset.value[pid] = offset; } else if (deltaX > 0) swipeOffset.value[pid] = 0; }
    function onTouchEnd(e, pid) { if (currentProductId !== pid) return; const finalOffset = swipeOffset.value[pid]; if (finalOffset > SWIPE_THRESHOLD) { swipeOffset.value[pid] = ACTION_WIDTH; swipeActionsRight.value[pid] = true; } else { swipeOffset.value[pid] = 0; swipeActionsRight.value[pid] = false; } currentProductId = null; }
    function toggleDetail(pid) { showDetail.value[pid] = !showDetail.value[pid]; }
    return { swipeOffset, swipeActionsRight, showDetail, closeAllSwipes, onTouchStart, onTouchMove, onTouchEnd, toggleDetail };
}

// 复制功能
function useCopy(showToast) {
    const copyHighlight = ref({});
    async function copySizeInfo(product, event) {
        const pid = product.id; copyHighlight.value[pid] = true; setTimeout(() => { copyHighlight.value[pid] = false; }, 1000);
        let lines = [`${product.sku} · (${utils.getProductTotalStock(product)}双)`];
        for (let color of product.colors) { lines.push(`${color.name}${utils.getColorTotal(color)}双`); lines.push(utils.parseSizeRange(color.sizeRange).map(d => `${d}/${utils.getStockForColor(color, d)}`).join(', ')); }
        const text = lines.join('\n');
        if (navigator.clipboard && window.isSecureContext) { try { await navigator.clipboard.writeText(text); showToast('库存信息已复制'); return; } catch (err) {} }
        const textarea = document.createElement('textarea'); textarea.value = text; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); document.body.removeChild(textarea); showToast('库存信息已复制');
    }
    return { copyHighlight, copySizeInfo };
}

// ========== 根组件 ==========
const App = {
    components: { AppHeader, ProductList, SearchPanel },
    setup() {
        const productData = useProductData();
        const modalState = useModalState();
        const feedback = { showToast: modalState.showToast, showConfirm: modalState.showConfirm, closeConfirm: modalState.closeConfirm, confirmResolve: modalState.confirmResolve };
        const inventory = useInventoryOperations(modalState, productData, feedback);
        const customerOrder = useCustomerOrder(modalState, productData, feedback);
        const dragExpand = useDragAndExpand(modalState.searchActive);
        const swipe = useSwipeActions(productData.productList);
        const copy = useCopy(modalState.showToast);
        
        async function loadProducts() {
            await dbService.open();
            productData.productList.value = await dbService.getAllProducts();
            await customerOrder.loadCustomers();
            productData.productList.value.forEach(p => { if (swipe.swipeOffset.value[p.id] === undefined) swipe.swipeOffset.value[p.id] = 0; if (swipe.swipeActionsRight.value[p.id] === undefined) swipe.swipeActionsRight.value[p.id] = false; });
            await nextTick(); dragExpand.computeAndSetPosition();
        }
        productData.loadProducts = loadProducts;
        
        function toggleSearch() { modalState.searchActive.value = !modalState.searchActive.value; if (!modalState.searchActive.value) productData.resetSearch(); }
        function closeSearch() { modalState.searchActive.value = false; productData.resetSearch(); }
        function onPanelHeightChange() { dragExpand.updateSearchPanelHeight(); }
        
        function openSaleSheet(product) { swipe.closeAllSwipes(); modalState.currentProduct.value = product; modalState.selectedCustomer.value = null; modalState.initSaleData(product); modalState.saleSheetVisible.value = true; nextTick(() => modalState.saleSheetActive.value = true); }
        function openStockInSheet(product) { swipe.closeAllSwipes(); modalState.currentProduct.value = product; modalState.initStockInData(product); modalState.stockInSheetVisible.value = true; nextTick(() => modalState.stockInSheetActive.value = true); }
        function closeSaleSheet() { modalState.saleSheetActive.value = false; setTimeout(() => modalState.saleSheetVisible.value = false, 350); }
        function closeStockInSheet() { modalState.stockInSheetActive.value = false; setTimeout(() => modalState.stockInSheetVisible.value = false, 350); }
        function openPricePresetModal() { modalState.pricePresetModalVisible.value = true; nextTick(() => modalState.pricePresetModalActive.value = true); }
        function closePricePresetModal() { modalState.pricePresetModalActive.value = false; setTimeout(() => modalState.pricePresetModalVisible.value = false, 200); }
        function selectPresetPrice(type) {
            const prices = modalState.currentProduct.value.salePrices || {}; let price = 0, label = '';
            if (type === 'retail') { price = prices.retail || 299; label = '零售价'; } else if (type === 'wholesale') { price = prices.wholesale || 168; label = '批发价'; } else { price = prices.discount || 239; label = '折扣价'; }
            modalState.skipPriceWatch = true; modalState.saleUnitPrice.value = price; modalState.presetButtonLabel.value = label; closePricePresetModal();
        }
        function openCostSettingModal() { modalState.tempInUnitPriceStr.value = modalState.inUnitPrice.value > 0 ? modalState.inUnitPrice.value.toString() : ''; modalState.tempInTotalCostStr.value = modalState.inTotalCost.value > 0 ? modalState.inTotalCost.value.toFixed(2) : ''; inventory.updateTempNumbers(); modalState.costSettingModalVisible.value = true; nextTick(() => modalState.costSettingModalActive.value = true); }
        function closeCostSettingModal() { modalState.costSettingModalActive.value = false; setTimeout(() => modalState.costSettingModalVisible.value = false, 200); }
        function openBatchModal() { modalState.batchPattern.value = ''; modalState.batchModalVisible.value = true; nextTick(() => modalState.batchModalActive.value = true); }
        function closeBatchModal() { modalState.batchModalActive.value = false; setTimeout(() => modalState.batchModalVisible.value = false, 200); }
        async function openCustomerSelector() { await customerOrder.loadCustomers(); modalState.customerSearch.value = ''; modalState.tempSelectedCustomerId.value = modalState.selectedCustomer.value ? modalState.selectedCustomer.value.id : null; modalState.customerSelectorVisible.value = true; nextTick(() => modalState.customerSelectorActive.value = true); }
        function closeCustomerSelector() { modalState.customerSelectorActive.value = false; setTimeout(() => modalState.customerSelectorVisible.value = false, 200); }
        function closeAddCustomer() { modalState.addCustomerActive.value = false; setTimeout(() => modalState.addCustomerVisible.value = false, 200); }
        function openAddProduct() { modalState.newProduct.value = { sku: '', name: '', tags: '', sizeRange: '34-39', colors: [{ name: '黑色', stockMap: {} }], costPrice: 0, salePrices: { retail: 299, wholesale: 168, discount: 239 } }; modalState.addProductVisible.value = true; nextTick(() => modalState.addProductActive.value = true); }
        function closeAddProduct() { modalState.addProductActive.value = false; setTimeout(() => modalState.addProductVisible.value = false, 200); }
        async function saveProduct() {
            if (!modalState.newProduct.value.sku || !modalState.newProduct.value.name) { modalState.showToast('请填写货号和名称'); return; }
            const tags = modalState.newProduct.value.tags.split(/[,，、\s]+/).filter(t => t.trim());
            const colors = modalState.newProduct.value.colors.map(c => { const stockMap = {}; utils.parseSizeRange(modalState.newProduct.value.sizeRange).forEach(d => stockMap[d] = 0); return { ...c, sizeRange: modalState.newProduct.value.sizeRange, stockMap }; });
            await dbService.addProduct({ ...modalState.newProduct.value, tags, colors }); modalState.showToast('添加成功'); await loadProducts(); closeAddProduct();
        }
        function openOrderSheet(tab) { modalState.orderTab.value = tab; customerOrder.refreshOrders(); modalState.orderSheetVisible.value = true; nextTick(() => modalState.orderSheetActive.value = true); }
        function closeOrderSheet() { modalState.orderSheetActive.value = false; setTimeout(() => modalState.orderSheetVisible.value = false, 350); }
        function switchOrderTab(tab) { modalState.orderTab.value = tab; customerOrder.refreshOrders(); }
        
        onMounted(() => { loadProducts(); dragExpand.computeAndSetPosition(); window.addEventListener('resize', dragExpand.computeAndSetPosition); const bc = document.querySelector('.blue-card-fixed'); if (bc) { bc.addEventListener('touchstart', dragExpand.onTouchStartDrag, { passive: false }); bc.addEventListener('touchmove', dragExpand.onTouchMoveDrag, { passive: false }); bc.addEventListener('touchend', dragExpand.onTouchEndDrag); } if (dragExpand.scrollableRef.value) { dragExpand.scrollableRef.value.addEventListener('touchstart', dragExpand.onScrollableTouchStart); dragExpand.scrollableRef.value.addEventListener('touchmove', dragExpand.onScrollableTouchMove, { passive: false }); dragExpand.scrollableRef.value.addEventListener('touchend', dragExpand.onScrollableTouchEnd); } });
        onUnmounted(() => { window.removeEventListener('resize', dragExpand.computeAndSetPosition); const bc = document.querySelector('.blue-card-fixed'); if (bc) { bc.removeEventListener('touchstart', dragExpand.onTouchStartDrag); bc.removeEventListener('touchmove', dragExpand.onTouchMoveDrag); bc.removeEventListener('touchend', dragExpand.onTouchEndDrag); } if (dragExpand.scrollableRef.value) { dragExpand.scrollableRef.value.removeEventListener('touchstart', dragExpand.onScrollableTouchStart); dragExpand.scrollableRef.value.removeEventListener('touchmove', dragExpand.onScrollableTouchMove); dragExpand.scrollableRef.value.removeEventListener('touchend', dragExpand.onScrollableTouchEnd); } });
        
        provide('getProductTotalStock', utils.getProductTotalStock.bind(utils)); provide('parseSizeRange', utils.parseSizeRange.bind(utils)); provide('getColorTotal', utils.getColorTotal.bind(utils)); provide('getStockForColor', utils.getStockForColor.bind(utils)); provide('filteredCount', productData.filteredCount);
        
        return {
            searchActive: modalState.searchActive, sidebarOpen: modalState.sidebarOpen, isExpanded: dragExpand.isExpanded, isDragging: dragExpand.isDragging, blueCardMarginTop: dragExpand.blueCardMarginTop, container2Top: dragExpand.container2Top, container2Height: dragExpand.container2Height, dynamicContainer2Top: dragExpand.dynamicContainer2Top, scrollableRef: dragExpand.scrollableRef,
            productList: productData.productList, totalStockAll: productData.totalStockAll, filteredProducts: productData.filteredProducts, showDetail: swipe.showDetail, swipeOffset: swipe.swipeOffset, swipeActionsRight: swipe.swipeActionsRight, copyHighlight: copy.copyHighlight,
            saleSheetVisible: modalState.saleSheetVisible, saleSheetActive: modalState.saleSheetActive, currentProduct: modalState.currentProduct, tempSaleData: modalState.tempSaleData, selectedCustomer: modalState.selectedCustomer, saleUnitPrice: modalState.saleUnitPrice, presetButtonLabel: modalState.presetButtonLabel, saleTotalQuantity: inventory.saleTotalQuantity, saleTotalAmount: inventory.saleTotalAmount,
            stockInSheetVisible: modalState.stockInSheetVisible, stockInSheetActive: modalState.stockInSheetActive, tempStockInData: modalState.tempStockInData, inUnitPrice: modalState.inUnitPrice, inTotalCost: modalState.inTotalCost, stockInTotalQuantity: inventory.stockInTotalQuantity, currentTotalStock: inventory.currentTotalStock,
            orderSheetVisible: modalState.orderSheetVisible, orderSheetActive: modalState.orderSheetActive, orderTab: modalState.orderTab, pendingOrders: modalState.pendingOrders, draftOrders: modalState.draftOrders,
            customerSelectorVisible: modalState.customerSelectorVisible, customerSelectorActive: modalState.customerSelectorActive, customerSearch: modalState.customerSearch, filteredCustomersForSelector: customerOrder.filteredCustomersForSelector, tempSelectedCustomerId: modalState.tempSelectedCustomerId,
            addCustomerVisible: modalState.addCustomerVisible, addCustomerActive: modalState.addCustomerActive, newCustomer: modalState.newCustomer,
            addProductVisible: modalState.addProductVisible, addProductActive: modalState.addProductActive, newProduct: modalState.newProduct,
            pricePresetModalVisible: modalState.pricePresetModalVisible, pricePresetModalActive: modalState.pricePresetModalActive,
            costSettingModalVisible: modalState.costSettingModalVisible, costSettingModalActive: modalState.costSettingModalActive, tempInUnitPriceStr: modalState.tempInUnitPriceStr, tempInTotalCostStr: modalState.tempInTotalCostStr, previewNewAvgCost: inventory.previewNewAvgCost, previewNewPriceClass: inventory.previewNewPriceClass,
            batchModalVisible: modalState.batchModalVisible, batchModalActive: modalState.batchModalActive, batchPattern: modalState.batchPattern,
            packingModalVisible: modalState.packingModalVisible, packingModalActive: modalState.packingModalActive, packingBoxSizeInput: modalState.packingBoxSizeInput, packingResults: modalState.packingResults, foldState: modalState.foldState,
            toastVisible: modalState.toastVisible, toastMessage: modalState.toastMessage, confirmVisible: modalState.confirmVisible, confirmActive: modalState.confirmActive, confirmTitle: modalState.confirmTitle, confirmMessage: modalState.confirmMessage,
            toggleSearch, closeSearch, onFilterChange: productData.onFilterChange, onSortChange: productData.onSortChange, onSearch: productData.onSearch, onPanelHeightChange,
            openAddProduct, closeAddProduct, saveProduct, openSaleSheet, openStockInSheet, closeSaleSheet, closeStockInSheet,
            openPricePresetModal, closePricePresetModal, selectPresetPrice, openCostSettingModal, closeCostSettingModal, confirmCostSetting: inventory.confirmCostSetting, onTempUnitPriceInput: inventory.onTempUnitPriceInput, onTempTotalCostInput: inventory.onTempTotalCostInput,
            openBatchModal, closeBatchModal, applyBatch: inventory.applyBatch,
            openPackingModal: inventory.openPackingModal, closePackingModal: inventory.closePackingModal, onPackingBoxSizeInput: inventory.onPackingBoxSizeInput, onPackingBoxSizeBlur: inventory.onPackingBoxSizeBlur, toggleFold: inventory.toggleFold, incrementSchemeCount: inventory.incrementSchemeCount, decrementSchemeCount: inventory.decrementSchemeCount, applyAllPacking: inventory.applyAllPacking,
            openCustomerSelector, closeCustomerSelector, toggleCustomerSelect: customerOrder.toggleCustomerSelect, confirmCustomerSelection: customerOrder.confirmCustomerSelection, openAddCustomerFromSelector: customerOrder.openAddCustomerFromSelector, closeAddCustomer, saveCustomer: customerOrder.saveCustomer,
            openOrderSheet, closeOrderSheet, switchOrderTab, formatOrderItems: customerOrder.formatOrderItems, confirmDraftOrder: customerOrder.confirmDraftOrder, markOrderPaid: customerOrder.markOrderPaid, confirmDeleteOrder: customerOrder.confirmDeleteOrder,
            getColorTotalSale: inventory.getColorTotalSale, getColorTotalStockIn: inventory.getColorTotalStockIn, adjustQuantity: inventory.adjustQuantity, adjustStockInQuantity: inventory.adjustStockInQuantity, validateQuantity: inventory.validateQuantity, validateStockInQuantity: inventory.validateStockInQuantity, fillMaxSale: inventory.fillMaxSale, clearSale: inventory.clearSale, clearStockIn: inventory.clearStockIn, batchMultiply: inventory.batchMultiply,
            submitDirectSale: () => inventory.submitDirectSale(loadProducts, customerOrder.refreshOrders), submitDraftOrder: () => inventory.submitDraftOrder(customerOrder.refreshOrders), submitStockIn: () => inventory.submitStockIn(loadProducts),
            onTouchStart: swipe.onTouchStart, onTouchMove: swipe.onTouchMove, onTouchEnd: swipe.onTouchEnd, toggleDetail: swipe.toggleDetail, copySizeInfo: copy.copySizeInfo,
            toggleExpand: dragExpand.toggleExpand,
            maskPhone: utils.maskPhone, getColorTotal: utils.getColorTotal.bind(utils), parseSizeRange: utils.parseSizeRange.bind(utils), getStockForColor: utils.getStockForColor.bind(utils), getProductTotalStock: utils.getProductTotalStock.bind(utils),
            showToast: modalState.showToast, closeConfirm: modalState.closeConfirm, confirmResolve: modalState.confirmResolve,
        };
    },
    template: `
        <div class="app-wrapper">
            <div class="container-2" :class="{ 'expanded-down': isExpanded, dragging: isDragging }" :style="{ top: dynamicContainer2Top + 'px', height: container2Height + 'px' }">
                <div class="drag-handle" v-if="!searchActive"><div class="click-area" @click="toggleExpand"></div><div class="drag-arrow"><svg viewBox="0 0 1024 1024"><path d="M231.424 346.208a32 32 0 0 0-46.848 43.584l297.696 320a32 32 0 0 0 46.4 0.48l310.304-320a32 32 0 1 0-45.952-44.544l-286.848 295.808-274.752-295.36z" fill="#8e9aaf"></path></svg></div><span>{{ isExpanded ? '收起看板' : '展开看板' }}</span></div>
                <div class="card-panel">
                    <div class="blue-card-fixed" v-if="!searchActive" ref="blueCardRef" :style="{ marginTop: blueCardMarginTop + 'px' }"><div class="four-stats-blue"><div class="blue-stat-item"><div class="blue-number">6</div><div class="blue-label">待收款</div></div><div class="blue-stat-item"><div class="blue-number">12</div><div class="blue-label">待拣货</div></div><div class="blue-stat-item"><div class="blue-number">4</div><div class="blue-label">待出库</div></div><div class="blue-stat-item"><div class="blue-number">2</div><div class="blue-label">待调拨</div></div></div><div class="warning-inline"><div class="warning-item"><div class="warning-icon-svg"><svg viewBox="0 0 1024 1024"><path d="M864 117.333333l0.021333 474.752A223.594667 223.594667 0 0 1 949.333333 768c0 123.712-100.288 224-224 224-61.013333 0-116.352-24.405333-156.757333-64H160v-810.666667h704z m-138.666667 490.666667a160 160 0 1 0 0 320 160 160 0 0 0 0-320z m74.666667-426.666667h-576v682.666667h298.88A223.146667 223.146667 0 0 1 501.333333 768c0-123.712 100.288-224 224-224 26.176 0 51.306667 4.48 74.666667 12.757333V181.333333zM725.333333 661.333333l31.36 63.509334 70.08 10.197333-50.709333 49.450667 11.946667 69.802666L725.333333 821.333333l-62.698666 32.96 11.968-69.802666-50.709334-49.450667 70.101334-10.197333L725.333333 661.333333z m-256-85.333333v64h-149.333333v-64h149.333333z m234.666667-149.333333v64H320v-64h384z m0-149.333334v64H320v-64h384z" fill="#FFFFFF"></path></svg></div>工单 <span class="warning-num">1</span></div><div class="warning-item"><div class="warning-icon-svg"><svg viewBox="0 0 1024 1024"><path d="M512 96c229.76 0 416 186.24 416 416S741.76 928 512 928 96 741.76 96 512 282.24 96 512 96z m0 64C317.589333 160 160 317.589333 160 512S317.589333 864 512 864 864 706.410667 864 512 706.410667 160 512 160z m0 155.904L708.096 512 512 708.096 315.904 512 512 315.904z m0 90.517333l-105.6 105.6L512 617.6 617.557333 512l-105.6-105.6z" fill="#FFFFFF"></path></svg></div>回款预警 <span class="warning-num">2</span></div></div></div>
                    <div class="scrollable-content" ref="scrollableRef">
                        <div class="announcement-area" v-if="!searchActive"><div class="announcement-inner"><div class="announce-left"><div class="announce-icon-svg"><svg viewBox="0 0 1024 1024"><path d="M678 464.9H316.8c-11.1 0-20.1 9-20.1 20.1 0 11.1 9 20.1 20.1 20.1H678c11.1 0 20.1-9 20.1-20.1 0-11.2-9-20.1-20.1-20.1zM678 585.3H316.8c-11.1 0-20.1 9-20.1 20.1 0 11.1 9 20.1 20.1 20.1H678c11.1 0 20.1-9 20.1-20.1 0-11.2-9-20.1-20.1-20.1z" fill="#FFFFFF"></path><path d="M818.5 282.3H647.7l-82.1-115.9c-1.2-1.6-2.5-3.1-4.1-4.4-35.9-29.2-92.3-29.2-128.2 0-1.5 1.3-2.9 2.7-4.1 4.4l-82.1 115.9H176.3c-5.8 0-11.4 2.3-15.6 6.4s-6.4 9.7-6.4 15.6v441.5c0 12.1 9.8 22 22 22h642.1c12.2 0 22-9.9 22-22V304.3c0.1-12.1-9.7-22-21.9-22z m-355.3-87.7c19.2-13.8 49.2-13.8 68.4 0l62.1 87.7H401.1l62.1-87.7z m333.3 529.2H198.3V326.3H316l-37.2 52.5c-7 9.9-4.7 23.6 5.2 30.7 3.9 2.7 8.3 4 12.7 4 6.9 0 13.7-3.2 18-9.3l55.2-78h255l55.2 78c7 9.9 20.8 12.3 30.7 5.2 9.9-7 12.2-20.8 5.2-30.7l-37.2-52.5h117.6v397.6z" fill="#FFFFFF"></path></svg></div><span class="announce-title">公告</span><span class="announce-text">主图点击最高提升30%，"素材测试"全新…</span></div><div class="announce-right"><div class="badge-red">3</div><i class="fas fa-chevron-right"></i></div></div></div>
                        <div class="product-full-section">
                            <ProductList :products="filteredProducts" :show-detail="showDetail" :swipe-offset="swipeOffset" :swipe-actions-right="swipeActionsRight" :copy-highlight="copyHighlight"
                                @touch-start="onTouchStart" @touch-move="onTouchMove" @touch-end="onTouchEnd" @toggle-detail="toggleDetail" @open-sale="openSaleSheet" @open-stock-in="openStockInSheet" @copy-size="copySizeInfo" />
                            <div class="extra-bottom-space"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="container-1" :class="{ 'search-active': searchActive }">
                <AppHeader shop-name="楚宝手工真皮女鞋" @toggle-sidebar="sidebarOpen = true" @search="toggleSearch" @scan="showToast('📷 扫码')" @add="openAddProduct" />
                <div class="kpi-flat-row"><div class="flat-kpi-item"><div class="flat-title">总库存</div><div class="flat-number">{{ totalStockAll }}</div><div class="flat-sub">23单 今日</div></div><div class="flat-kpi-item"><div class="flat-title">货品数</div><div class="flat-number">{{ productList.length }}</div><div class="flat-sub">0 今日新增</div></div><div class="flat-kpi-item"><div class="flat-title">现季比</div><div class="flat-number">50%</div><div class="flat-sub">有库存占比68%</div></div></div>
                <div class="expanded-block" :class="{ show: isExpanded }"><div class="metrics-row"><div class="metric-item"><div class="metric-title">动销率</div><div class="metric-value">78%</div><div class="metric-trend">↑5%</div></div><div class="metric-item"><div class="metric-title">缺货预警</div><div class="metric-value">2</div><div class="metric-trend">需补货</div></div><div class="metric-item"><div class="metric-title">周转天数</div><div class="metric-value">32天</div><div class="metric-trend">同比-3天</div></div></div></div>
                <div class="copyright-in-container1">© 龙虾手 v7</div>
            </div>
            <transition name="search-panel"><SearchPanel v-if="searchActive" @close="closeSearch" @filter-change="onFilterChange" @sort-change="onSortChange" @search="onSearch" @panel-height-change="onPanelHeightChange" /></transition>
            <div v-if="toastVisible" class="toast-message">{{ toastMessage }}</div>
            <div v-if="confirmVisible" class="modal-center" :class="{ active: confirmActive }" @click="closeConfirm"><div class="modal-card" @click.stop style="max-width: 300px;"><div class="modal-header"><span>{{ confirmTitle }}</span><span style="cursor:pointer" @click="closeConfirm">✕</span></div><div class="modal-body" style="padding: 20px; text-align: center;">{{ confirmMessage }}</div><div class="modal-footer" style="justify-content: center;"><button class="btn-confirm" @click="confirmResolve(true)">确定</button><button class="btn-cancel" @click="confirmResolve(false)">取消</button></div></div></div>
            <div class="sidebar-overlay" :class="{ show: sidebarOpen }" @click="sidebarOpen = false"></div>
            <div class="sidebar" :class="{ open: sidebarOpen }"><div class="sidebar-inner"><div class="sidebar-left"><div class="shop-list-item"><div class="shop-avatar"><svg viewBox="0 0 1024 1024"><path d="M815.40608 280.5248H206.48448L143.27808 445.9264c0 49.51552 41.088 90.5984 91.65312 90.5984s92.70784-40.03328 92.70784-90.5984c0 49.51552 41.088 90.5984 91.65312 90.5984S512 496.49152 512 445.9264c0 49.51552 41.088 90.5984 91.65312 90.5984s91.65312-40.03328 91.65312-90.5984c0 49.51552 41.088 90.5984 92.70784 90.5984 50.56512 0 92.70784-40.03328 92.70784-90.5984L815.40608 280.5248z m-50.57024 284.44672v210.69824H259.16416v-210.69824H206.4896v221.2352c0 18.96448 21.0688 42.1376 40.03328 42.1376h529.90464c18.96448 0 40.03328-23.17824 40.03328-42.1376v-221.2352h-51.62496z m50.57024-285.49632l2.10944 1.05472-2.10944-1.05472zM248.6272 238.3872h526.7456c17.90976 0 31.60576-13.696 31.60576-31.60576s-13.696-31.60576-31.60576-31.60576H248.6272c-17.90976 0-31.60576 13.696-31.60576 31.60576s13.696 31.60576 31.60576 31.60576z" fill="white"></path></svg></div><div class="shop-list-name">楚宝手工真皮女鞋</div></div><div class="add-shop-btn" @click="showToast('添加新店铺功能开发中')"><div class="add-shop-circle"><i class="fas fa-plus"></i></div><div class="add-shop-text">添加店铺</div></div></div><div class="sidebar-right"><div class="current-shop-header">楚宝手工真皮女鞋</div><div class="sidebar-menu"><div class="sidebar-item" @click="openOrderSheet('pending')"><i class="fas fa-credit-card"></i><span>待付款</span></div><div class="sidebar-item" @click="openOrderSheet('draft')"><i class="fas fa-clipboard-list"></i><span>工单</span></div><div class="sidebar-item" @click="showToast('商品管理开发中')"><i class="fas fa-boxes"></i><span>商品管理</span></div><div class="sidebar-item" @click="showToast('数据看板开发中')"><i class="fas fa-chart-line"></i><span>数据看板</span></div><div class="sidebar-item" @click="showToast('设置功能开发中')"><i class="fas fa-cog"></i><span>设置</span></div></div><div class="sidebar-footer">© 龙虾手 v7</div></div></div></div>
            <div v-if="saleSheetVisible" class="bottom-sheet-overlay" :class="{ active: saleSheetActive }" @click="closeSaleSheet"><div class="bottom-sheet" @click.stop><div class="sheet-handle" @click="closeSaleSheet"><div class="handle-bar"></div></div><div class="sheet-title"><div class="title-left"><i class="fas fa-arrow-up title-icon"></i><span class="title-prefix">出库·</span><span class="title-product">{{ currentProduct?.sku }} {{ currentProduct?.name }}</span></div><button class="select-customer-btn" @click.stop="openCustomerSelector"><i class="fas fa-user-friends"></i><span class="selected-customer-name">{{ selectedCustomer ? (selectedCustomer.name.length > 4 ? selectedCustomer.name.slice(0,4)+'…' : selectedCustomer.name) : '选择客户' }}</span></button></div><div class="sheet-scrollable"><div v-for="(color, idx) in currentProduct?.colors" :key="color.name" class="color-block"><div class="color-header"><span class="color-name">{{ color.name }}</span><div v-if="idx === 0" class="global-price-area"><span class="price-symbol">¥</span><input type="number" v-model.number="saleUnitPrice" class="price-input" step="1" min="0" placeholder="销售单价"><button class="icon-btn" @click="openPricePresetModal">{{ presetButtonLabel }}</button></div><div class="color-stats"><span class="color-stock">库存 {{ getColorTotal(color) }}</span><span class="color-total-count sale">出 {{ getColorTotalSale(color.name) }}</span></div></div><div class="size-grid"><div v-for="digit in parseSizeRange(color.sizeRange)" :key="digit" class="size-input-item"><div class="size-left" @click="adjustQuantity(color.name, digit, -1)">{{ digit }}码</div><input type="number" v-model.number="tempSaleData[color.name][digit]" class="size-input" min="0" :max="getStockForColor(color, digit)" step="1" @input="validateQuantity(color.name, digit)"><div class="size-right sale" @click="adjustQuantity(color.name, digit, 1)">余 {{ getStockForColor(color, digit) - (tempSaleData[color.name][digit] || 0) }}</div></div></div></div></div><div class="sheet-footer"><details class="action-panel"><summary><div class="summary-left">快捷操作</div><div class="summary-right" v-if="saleTotalQuantity > 0">共 {{ saleTotalQuantity }} 双 | 总价 ¥{{ saleTotalAmount }}</div></summary><div class="action-buttons"><button class="action-btn" @click="fillMaxSale">全选最大</button><button class="action-btn" @click="clearSale" :disabled="saleTotalQuantity === 0">清空</button><button class="action-btn" @click="openPackingModal">配箱</button></div></details><button class="btn-primary" @click="submitDirectSale">确认出库（待付款）</button><button class="btn-secondary" @click="submitDraftOrder">挂起工单</button></div></div></div>
            <div v-if="stockInSheetVisible" class="bottom-sheet-overlay" :class="{ active: stockInSheetActive }" @click="closeStockInSheet"><div class="bottom-sheet" @click.stop><div class="sheet-handle" @click="closeStockInSheet"><div class="handle-bar"></div></div><div class="sheet-title"><div class="title-left"><i class="fas fa-arrow-down" style="color:#2ecc71"></i><span class="title-prefix">入库·</span><span class="title-product">{{ currentProduct?.sku }} {{ currentProduct?.name }}</span></div></div><div class="sheet-scrollable"><div v-for="(color, idx) in currentProduct?.colors" :key="color.name" class="color-block"><div class="color-header"><span class="color-name">{{ color.name }}</span><div v-if="idx === 0" class="global-price-area"><button class="icon-btn" @click="openCostSettingModal">入库价格（可选）</button></div><div class="color-stats"><span class="color-stock">库存 {{ getColorTotal(color) }}</span><span class="color-total-count in">入 {{ getColorTotalStockIn(color.name) }}</span></div></div><div class="size-grid"><div v-for="digit in parseSizeRange(color.sizeRange)" :key="digit" class="size-input-item"><div class="size-left" @click="adjustStockInQuantity(color.name, digit, -1)">{{ digit }}码</div><input type="number" v-model.number="tempStockInData[color.name][digit]" class="size-input" min="0" step="1" @input="validateStockInQuantity(color.name, digit)"><div class="size-right in" @click="adjustStockInQuantity(color.name, digit, 1)">现 {{ getStockForColor(color, digit) + (tempStockInData[color.name][digit] || 0) }}</div></div></div></div></div><div class="sheet-footer"><details class="action-panel"><summary><div class="summary-left">快捷操作</div><div class="summary-right" v-if="stockInTotalQuantity > 0">共 {{ stockInTotalQuantity }} 双</div></summary><div class="action-buttons"><button class="action-btn" @click="batchMultiply(0.5)" :disabled="stockInTotalQuantity === 0">倍减</button><span class="action-divider"></span><button class="action-btn" @click="batchMultiply(2)" :disabled="stockInTotalQuantity === 0">倍增</button><button class="action-btn" @click="clearStockIn" :disabled="stockInTotalQuantity === 0">清空</button><button class="action-btn" @click="openBatchModal">批量</button></div></details><button class="btn-primary" @click="submitStockIn">确认入库</button></div></div></div>
            <div v-if="batchModalVisible" class="modal-center" :class="{ active: batchModalActive }" @click="closeBatchModal"><div class="modal-card" @click.stop style="max-width: 420px;"><div class="modal-header"><span>批量入库</span><span style="cursor:pointer" @click="closeBatchModal">✕</span></div><div class="modal-body" style="padding: 16px;"><textarea class="batch-textarea" placeholder="自由格式示例：&#10;34-39&#10;5 6 12 34 12 1&#10;34-36 38-40&#10;7 6 8 9 10 1&#10;## 34 35 36&#10;3 6 7&#10;* 5 5 5 5 5&#10;# 跳过颜色" v-model="batchPattern"></textarea><div class="empty-tip" style="padding: 8px 0; font-size: 11px;">支持区间 34-39、枚举、混合。# 跳过颜色，连续 ## 跳过两个。* 表示默认尺码（可同行跟数量或换行）。</div></div><div class="modal-footer"><button class="btn-confirm" @click="applyBatch">应用</button><button class="btn-cancel" @click="closeBatchModal">取消</button></div></div></div>
            <div v-if="packingModalVisible" class="modal-center" :class="{ active: packingModalActive }" @click="closePackingModal"><div class="modal-card" @click.stop style="max-width: 480px;"><div class="modal-header" style="padding: 12px 16px;"><span style="font-size: 16px;">智能配箱</span><div style="display: flex; align-items: center; gap: 12px;"><input type="text" inputmode="numeric" v-model="packingBoxSizeInput" class="packing-box-input" :class="{ 'has-value': packingBoxSizeInput && packingBoxSizeInput.trim() !== '' }" placeholder="默认30配" @input="onPackingBoxSizeInput" @blur="onPackingBoxSizeBlur"><span style="cursor:pointer; font-size: 20px;" @click="closePackingModal">✕</span></div></div><div class="modal-body" style="padding: 8px 16px;"><div v-for="color in currentProduct?.colors" :key="color.name" class="packing-color-section"><div class="packing-color-title"><span>{{ color.name }}</span><span class="fold-symbol" @click.stop="toggleFold(color.name)">{{ foldState[color.name] ? '−' : '+' }}</span></div><div v-show="foldState[color.name] !== false"><div v-if="packingResults[color.name] && packingResults[color.name].length"><div v-for="(scheme, idx) in packingResults[color.name]" :key="idx" class="packing-scheme"><div class="scheme-detail"><template v-for="(val, size) in scheme.allocation" :key="size"><span class="scheme-size-item">{{ size }}<span class="slash">/</span><span class="count">{{ val }}</span></span></template></div><div class="scheme-actions"><div class="scheme-count-box"><button @click="decrementSchemeCount(color.name, idx)">−</button><div class="count-display"><span class="selected-number">{{ scheme.selectedCount }}</span><span class="slash-total">/</span><span class="total-number">{{ scheme.count }}</span></div><button @click="incrementSchemeCount(color.name, idx)">+</button></div></div></div></div><div v-else class="empty-tip" style="padding: 12px;">无可用配箱方案</div></div></div></div><div class="modal-footer"><button class="btn-confirm" @click="applyAllPacking">应用方案</button><button class="btn-cancel" @click="closePackingModal">取消</button></div></div></div>
            <div v-if="orderSheetVisible" class="bottom-sheet-overlay" :class="{ active: orderSheetActive }" @click="closeOrderSheet"><div class="bottom-sheet" @click.stop><div class="sheet-handle" @click="closeOrderSheet"><div class="handle-bar"></div></div><div class="sheet-content" style="padding:0 16px 20px;"><div class="tab-bar"><div class="tab" :class="{ active: orderTab === 'pending' }" @click="switchOrderTab('pending')">待付款</div><div class="tab" :class="{ active: orderTab === 'draft' }" @click="switchOrderTab('draft')">工单</div></div><div v-if="orderTab === 'pending'"><div v-for="order in pendingOrders" :key="order.id" class="order-item"><div class="order-header"><span class="order-no">{{ order.order_no }}</span><span class="order-status pending">待付款</span></div><div class="order-customer">{{ order.customer_name || '未填写' }} {{ order.customer_phone || '' }}</div><div class="order-items">{{ formatOrderItems(order.items) }}</div><div class="order-total">合计: {{ order.total_quantity }}双</div><div class="order-actions"><button class="confirm-btn" @click="markOrderPaid(order)">标记已付款</button><button class="delete-btn" @click="confirmDeleteOrder(order)">删除</button></div></div><div v-if="pendingOrders.length === 0" style="text-align:center; padding:40px; color:#8e9aaf;">暂无待付款订单</div></div><div v-if="orderTab === 'draft'"><div v-for="order in draftOrders" :key="order.id" class="order-item"><div class="order-header"><span class="order-no">{{ order.order_no }}</span><span class="order-status draft">工单</span></div><div class="order-customer">{{ order.customer_name || '未填写' }} {{ order.customer_phone || '' }}</div><div class="order-items">{{ formatOrderItems(order.items) }}</div><div class="order-total">合计: {{ order.total_quantity }}双</div><div class="order-actions"><button class="confirm-btn" @click="confirmDraftOrder(order)">确认出库</button><button class="delete-btn" @click="confirmDeleteOrder(order)">删除</button></div></div><div v-if="draftOrders.length === 0" style="text-align:center; padding:40px; color:#8e9aaf;">暂无工单</div></div></div></div></div>
            <div v-if="customerSelectorVisible" class="modal-center" :class="{ active: customerSelectorActive }" @click="closeCustomerSelector"><div class="modal-card" @click.stop><div class="modal-header"><span>选择客户</span><span style="cursor:pointer" @click="closeCustomerSelector">✕</span></div><div class="modal-body"><input type="text" class="search-input" placeholder="搜索姓名/电话" v-model="customerSearch"><div class="customer-list"><template v-if="customerSearch.trim() === '' && selectedCustomer"><div class="customer-list-item" @click="toggleCustomerSelect(selectedCustomer.id)"><div class="custom-radio" :class="{ selected: tempSelectedCustomerId === selectedCustomer.id }"></div><div class="customer-info"><div class="customer-name-phone"><span class="customer-name">{{ selectedCustomer.name }}</span><span class="customer-phone">{{ maskPhone(selectedCustomer.phone) }}</span></div><div class="customer-address">{{ selectedCustomer.address || '无地址' }}</div></div></div></template><template v-else-if="customerSearch.trim() === '' && !selectedCustomer"><div class="empty-tip">搜索关键字查找</div></template><template v-else><div v-for="c in filteredCustomersForSelector" :key="c.id" class="customer-list-item" @click="toggleCustomerSelect(c.id)"><div class="custom-radio" :class="{ selected: tempSelectedCustomerId === c.id }"></div><div class="customer-info"><div class="customer-name-phone"><span class="customer-name">{{ c.name }}</span><span class="customer-phone">{{ maskPhone(c.phone) }}</span></div><div class="customer-address">{{ c.address || '无地址' }}</div></div></div><div v-if="filteredCustomersForSelector.length === 0 && customerSearch.trim() !== ''" class="empty-tip">暂无匹配客户，请添加</div></template></div></div><div class="modal-footer"><button class="btn-confirm" @click="confirmCustomerSelection">确定</button><button class="btn-cancel" @click="openAddCustomerFromSelector">添加客户</button></div></div></div>
            <div v-if="pricePresetModalVisible" class="modal-center" :class="{ active: pricePresetModalActive }" @click="closePricePresetModal"><div class="modal-card" @click.stop><div class="modal-header"><span>选择销售价格</span><span style="cursor:pointer" @click="closePricePresetModal">✕</span></div><div class="modal-body"><div class="price-option" @click="selectPresetPrice('retail')"><span>零售价</span><span>¥{{ currentProduct?.salePrices?.retail || 299 }}</span></div><div class="price-option" @click="selectPresetPrice('wholesale')"><span>批发价</span><span>¥{{ currentProduct?.salePrices?.wholesale || 168 }}</span></div><div class="price-option" @click="selectPresetPrice('discount')"><span>折扣价</span><span>¥{{ currentProduct?.salePrices?.discount || 239 }}</span></div></div></div></div>
            <div v-if="costSettingModalVisible" class="modal-center" :class="{ active: costSettingModalActive }" @click="closeCostSettingModal"><div class="modal-card" @click.stop><div class="modal-header"><span>入库价格设置（可选）</span><span style="cursor:pointer" @click="closeCostSettingModal">✕</span></div><div class="modal-body"><div class="cost-row"><span>现库价(¥)</span><span class="cost-divider"><span class="cost-old">{{ (currentProduct?.costPrice || 0).toFixed(2) }}</span><template v-if="stockInTotalQuantity > 0 && (tempInUnitPriceNum > 0 || tempInTotalCostNum > 0)"><span class="cost-old"> / </span><span :class="['cost-new', previewNewPriceClass]">{{ previewNewAvgCost.toFixed(2) }}</span></template></span></div><div class="cost-row"><span>入库量(双)</span><span class="cost-divider"><span class="cost-old">{{ currentTotalStock }}</span><template v-if="stockInTotalQuantity > 0"><span class="cost-old"> / </span><span class="cost-quantity-new">{{ stockInTotalQuantity }}</span></template></span></div><div class="cost-input-group"><div class="cost-input-item"><label>入库单价(¥)</label><input type="text" v-model="tempInUnitPriceStr" placeholder="不填则成本不变" @input="onTempUnitPriceInput"></div><div class="cost-input-item"><label>入库总价(¥)</label><input type="text" v-model="tempInTotalCostStr" placeholder="不填则成本不变" @input="onTempTotalCostInput"></div></div></div><div class="modal-footer"><button class="btn-confirm" @click="confirmCostSetting">确定</button><button class="btn-cancel" @click="closeCostSettingModal">取消</button></div></div></div>
            <div v-if="addCustomerVisible" class="modal-center" :class="{ active: addCustomerActive }" @click="closeAddCustomer"><div class="modal-card" @click.stop style="max-width: 320px;"><div class="modal-header"><span>添加客户</span><span style="cursor:pointer" @click="closeAddCustomer">✕</span></div><div class="modal-body" style="padding:16px;"><input type="text" placeholder="姓名" v-model="newCustomer.name" class="search-input" style="margin-bottom:12px;"><input type="tel" placeholder="电话" v-model="newCustomer.phone" class="search-input" style="margin-bottom:12px;"><input type="text" placeholder="地址" v-model="newCustomer.address" class="search-input"></div><div class="modal-footer" style="justify-content: center;"><button class="btn-confirm" @click="saveCustomer">保存</button><button class="btn-cancel" @click="closeAddCustomer">取消</button></div></div></div>
            <div v-if="addProductVisible" class="modal-center" :class="{ active: addProductActive }" @click="closeAddProduct"><div class="modal-card" @click.stop style="max-width: 420px;"><div class="modal-header"><span>添加商品</span><span style="cursor:pointer" @click="closeAddProduct">✕</span></div><div class="modal-body"><div class="form-group"><label class="form-label">货号 SKU</label><input class="form-input" v-model="newProduct.sku" placeholder="如 XB-2401"></div><div class="form-group"><label class="form-label">商品名称</label><input class="form-input" v-model="newProduct.name" placeholder="如 法式乐福鞋"></div><div class="form-group"><label class="form-label">标签 (逗号分隔)</label><input class="form-input" v-model="newProduct.tags" placeholder="头层牛皮,手工缝线"></div><div class="form-group"><label class="form-label">尺码范围</label><input class="form-input" v-model="newProduct.sizeRange" placeholder="34-39"></div><div class="form-group"><label class="form-label">成本价 (¥)</label><input class="form-input" type="number" v-model.number="newProduct.costPrice"></div><div class="form-group"><label class="form-label">零售价 (¥)</label><input class="form-input" type="number" v-model.number="newProduct.salePrices.retail"></div><div class="form-group"><label class="form-label">批发价 (¥)</label><input class="form-input" type="number" v-model.number="newProduct.salePrices.wholesale"></div><div class="form-group"><label class="form-label">折扣价 (¥)</label><input class="form-input" type="number" v-model.number="newProduct.salePrices.discount"></div></div><div class="modal-footer"><button class="btn-confirm" @click="saveProduct">保存</button><button class="btn-cancel" @click="closeAddProduct">取消</button></div></div></div>
        </div>
    `
};

// 导出挂载函数
export function mountApp(selector) {
    const app = createApp(App);
    app.mount(selector);
}