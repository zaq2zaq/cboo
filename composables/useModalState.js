import { ref } from 'vue';
import { utils } from '../utils.js';

export function useModalState() {
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