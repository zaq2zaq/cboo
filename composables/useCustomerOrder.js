import { computed, nextTick } from 'vue';
import { dbService } from '../db.js';

export function useCustomerOrder(state, productData, feedback) {
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