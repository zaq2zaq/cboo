import { createApp, onMounted, onUnmounted, nextTick, provide } from 'vue';
import { utils } from './utils.js';
import { dbService } from './db.js';
import { AppHeader, ProductList, SearchPanel } from './components.js';
import { useProductData } from './composables/useProductData.js';
import { useModalState } from './composables/useModalState.js';
import { useInventoryOperations } from './composables/useInventoryOperations.js';
import { useCustomerOrder } from './composables/useCustomerOrder.js';
import { useDragAndExpand } from './composables/useDragAndExpand.js';
import { useSwipeActions } from './composables/useSwipeActions.js';
import { useCopy } from './composables/useCopy.js';

// 导入模板片段
import dragPanelTemplate from './templates/DragPanel.js';
import mainHeaderTemplate from './templates/MainHeader.js';
import sidebarTemplate from './templates/Sidebar.js';
import modalsTemplate from './templates/Modals.js';

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
        
        function toggleSearch() {
            if (!modalState.searchActive.value) {
                if (dragExpand.isExpanded.value) dragExpand.toggleExpand();
            }
            modalState.searchActive.value = !modalState.searchActive.value;
            if (!modalState.searchActive.value) productData.resetSearch();
        }
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
            ${dragPanelTemplate}
            ${mainHeaderTemplate}
            <transition name="search-panel">
                <SearchPanel v-if="searchActive" @close="closeSearch" @filter-change="onFilterChange" @sort-change="onSortChange" @search="onSearch" @panel-height-change="onPanelHeightChange" />
            </transition>
            ${sidebarTemplate}
            ${modalsTemplate}
        </div>
    `
};

export function mountApp(selector) {
    const app = createApp(App);
    app.mount(selector);
}