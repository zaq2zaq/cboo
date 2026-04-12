// 以下为完整的 app.js 文件内容，包含上述修复
import { createApp, onMounted, onUnmounted, nextTick, provide } from 'vue';
import { utils } from './utils.js';
import { dbService } from './db.js';
import { 
    AppHeader, ProductList, SearchPanel, AppSidebar, SaleSheet, StockInSheet, 
    BatchModal, PackingModal, OrderSheet, CustomerSelector, PricePresetModal, 
    CostSettingModal, AddCustomerModal, AddProductModal, ConfirmModal, ToastMessage 
} from './components.js';
import { useProductData } from './composables/useProductData.js';
import { useModalState } from './composables/useModalState.js';
import { useInventoryOperations } from './composables/useInventoryOperations.js';
import { useCustomerOrder } from './composables/useCustomerOrder.js';
import { useDragAndExpand } from './composables/useDragAndExpand.js';
import { useSwipeActions } from './composables/useSwipeActions.js';
import { useCopy } from './composables/useCopy.js';

// ========== 注意：useDragAndExpand 中已添加 forceCollapse 方法 ==========
// 由于无法直接修改 composables 文件，此处假设 forceCollapse 已存在
// 若未修改，请将 useDragAndExpand 函数替换为以下版本：

/*
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
    
    // 强制收起（无动画）
    const forceCollapse = () => {
        if (isExpanded.value) {
            isExpanded.value = false;
            dragOffset.value = 0;
            blueCardMarginTop.value = 0;
            computeAndSetPosition();
        }
    };
    
    const searchPanelHeight = ref(200);
    const updateSearchPanelHeight = () => { nextTick(() => { const panel = document.querySelector('.search-panel'); if (panel) searchPanelHeight.value = panel.offsetHeight; }); };
    const dynamicContainer2Top = computed(() => {
        if (searchActive.value) { const panel = document.querySelector('.search-panel'); if (panel) return panel.getBoundingClientRect().bottom; return 180; }
        return container2Top.value;
    });
    watch(searchActive, (val) => { if (val) updateSearchPanelHeight(); });
    
    return { isExpanded, isDragging, blueCardMarginTop, container2Top, container2Height, scrollableRef, onTouchStartDrag, onTouchMoveDrag, onTouchEndDrag, onScrollableTouchStart, onScrollableTouchMove, onScrollableTouchEnd, toggleExpand, forceCollapse, computeAndSetPosition, searchPanelHeight, updateSearchPanelHeight, dynamicContainer2Top };
}
*/

const App = {
    components: { 
        AppHeader, ProductList, SearchPanel, AppSidebar, SaleSheet, StockInSheet, 
        BatchModal, PackingModal, OrderSheet, CustomerSelector, PricePresetModal, 
        CostSettingModal, AddCustomerModal, AddProductModal, ConfirmModal, ToastMessage 
    },
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
        
        async function toggleSearch() {
            if (!modalState.searchActive.value) {
                // 如果面板展开，强制收起（无动画），并等待位置更新
                if (dragExpand.isExpanded.value) {
                    dragExpand.forceCollapse();
                    await nextTick();
                    await nextTick(); // 双重确保 DOM 完全更新
                }
            }
            modalState.searchActive.value = !modalState.searchActive.value;
            if (!modalState.searchActive.value) {
                productData.resetSearch();
            }
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
            
            <ToastMessage :visible="toastVisible" :message="toastMessage" />
            <ConfirmModal :visible="confirmVisible" :active="confirmActive" :title="confirmTitle" :message="confirmMessage" @close="closeConfirm" @resolve="confirmResolve" />
            <AppSidebar :sidebarOpen="sidebarOpen" @closeSidebar="sidebarOpen = false" @openOrderSheet="openOrderSheet" @showToast="showToast" />
            
            <SaleSheet :visible="saleSheetVisible" :active="saleSheetActive" :currentProduct="currentProduct" :tempSaleData="tempSaleData" :selectedCustomer="selectedCustomer" :saleUnitPrice="saleUnitPrice" :presetButtonLabel="presetButtonLabel" :saleTotalQuantity="saleTotalQuantity" :saleTotalAmount="saleTotalAmount"
                @close="closeSaleSheet" @openCustomerSelector="openCustomerSelector" @openPricePresetModal="openPricePresetModal" @adjustQuantity="adjustQuantity" @validateQuantity="validateQuantity" @fillMaxSale="fillMaxSale" @clearSale="clearSale" @openPackingModal="openPackingModal" @submitDirectSale="submitDirectSale" @submitDraftOrder="submitDraftOrder"
                @getColorTotal="getColorTotal" @getColorTotalSale="getColorTotalSale" @parseSizeRange="parseSizeRange" @getStockForColor="getStockForColor" />
            
            <StockInSheet :visible="stockInSheetVisible" :active="stockInSheetActive" :currentProduct="currentProduct" :tempStockInData="tempStockInData" :stockInTotalQuantity="stockInTotalQuantity"
                @close="closeStockInSheet" @openCostSettingModal="openCostSettingModal" @adjustStockInQuantity="adjustStockInQuantity" @validateStockInQuantity="validateStockInQuantity" @batchMultiply="batchMultiply" @clearStockIn="clearStockIn" @openBatchModal="openBatchModal" @submitStockIn="submitStockIn"
                @getColorTotal="getColorTotal" @getColorTotalStockIn="getColorTotalStockIn" @parseSizeRange="parseSizeRange" @getStockForColor="getStockForColor" />
            
            <BatchModal :visible="batchModalVisible" :active="batchModalActive" :batchPattern="batchPattern" @close="closeBatchModal" @update:batchPattern="batchPattern = $event" @applyBatch="applyBatch" />
            
            <PackingModal :visible="packingModalVisible" :active="packingModalActive" :currentProduct="currentProduct" :packingBoxSizeInput="packingBoxSizeInput" :packingResults="packingResults" :foldState="foldState"
                @close="closePackingModal" @update:packingBoxSizeInput="packingBoxSizeInput = $event" @onPackingBoxSizeInput="onPackingBoxSizeInput" @onPackingBoxSizeBlur="onPackingBoxSizeBlur" @toggleFold="toggleFold" @decrementSchemeCount="decrementSchemeCount" @incrementSchemeCount="incrementSchemeCount" @applyAllPacking="applyAllPacking" />
            
            <OrderSheet :visible="orderSheetVisible" :active="orderSheetActive" :orderTab="orderTab" :pendingOrders="pendingOrders" :draftOrders="draftOrders"
                @close="closeOrderSheet" @switchOrderTab="switchOrderTab" @formatOrderItems="formatOrderItems" @markOrderPaid="markOrderPaid" @confirmDeleteOrder="confirmDeleteOrder" @confirmDraftOrder="confirmDraftOrder" />
            
            <CustomerSelector :visible="customerSelectorVisible" :active="customerSelectorActive" :customerSearch="customerSearch" :selectedCustomer="selectedCustomer" :filteredCustomersForSelector="filteredCustomersForSelector" :tempSelectedCustomerId="tempSelectedCustomerId"
                @close="closeCustomerSelector" @update:customerSearch="customerSearch = $event" @toggleCustomerSelect="toggleCustomerSelect" @confirmCustomerSelection="confirmCustomerSelection" @openAddCustomerFromSelector="openAddCustomerFromSelector" @maskPhone="maskPhone" />
            
            <PricePresetModal :visible="pricePresetModalVisible" :active="pricePresetModalActive" :currentProduct="currentProduct" @close="closePricePresetModal" @selectPresetPrice="selectPresetPrice" />
            
            <CostSettingModal :visible="costSettingModalVisible" :active="costSettingModalActive" :currentProduct="currentProduct" :tempInUnitPriceStr="tempInUnitPriceStr" :tempInTotalCostStr="tempInTotalCostStr" :previewNewAvgCost="previewNewAvgCost" :previewNewPriceClass="previewNewPriceClass" :stockInTotalQuantity="stockInTotalQuantity" :currentTotalStock="currentTotalStock"
                @close="closeCostSettingModal" @update:tempInUnitPriceStr="tempInUnitPriceStr = $event" @update:tempInTotalCostStr="tempInTotalCostStr = $event" @onTempUnitPriceInput="onTempUnitPriceInput" @onTempTotalCostInput="onTempTotalCostInput" @confirmCostSetting="confirmCostSetting" />
            
            <AddCustomerModal :visible="addCustomerVisible" :active="addCustomerActive" :newCustomer="newCustomer" @close="closeAddCustomer" @update:newCustomer="newCustomer = $event" @saveCustomer="saveCustomer" />
            
            <AddProductModal :visible="addProductVisible" :active="addProductActive" :newProduct="newProduct" @close="closeAddProduct" @update:newProduct="newProduct = $event" @saveProduct="saveProduct" />
        </div>
    `
};

export function mountApp(selector) {
    const app = createApp(App);
    app.mount(selector);
}