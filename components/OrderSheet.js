export const OrderSheet = {
    props: ['visible', 'active', 'orderTab', 'pendingOrders', 'draftOrders'],
    emits: ['close', 'switchOrderTab', 'formatOrderItems', 'markOrderPaid', 'confirmDeleteOrder', 'confirmDraftOrder'],
    template: `
        <div v-if="visible" class="bottom-sheet-overlay" :class="{ active: active }" @click="$emit('close')">
            <div class="bottom-sheet" @click.stop>
                <div class="sheet-handle" @click="$emit('close')"><div class="handle-bar"></div></div>
                <div class="sheet-content" style="padding:0 16px 20px;">
                    <div class="tab-bar">
                        <div class="tab" :class="{ active: orderTab === 'pending' }" @click="$emit('switchOrderTab', 'pending')">待付款</div>
                        <div class="tab" :class="{ active: orderTab === 'draft' }" @click="$emit('switchOrderTab', 'draft')">工单</div>
                    </div>
                    <div v-if="orderTab === 'pending'">
                        <div v-for="order in pendingOrders" :key="order.id" class="order-item">
                            <div class="order-header"><span class="order-no">{{ order.order_no }}</span><span class="order-status pending">待付款</span></div>
                            <div class="order-customer">{{ order.customer_name || '未填写' }} {{ order.customer_phone || '' }}</div>
                            <div class="order-items">{{ $emit('formatOrderItems', order.items) }}</div>
                            <div class="order-total">合计: {{ order.total_quantity }}双</div>
                            <div class="order-actions">
                                <button class="confirm-btn" @click="$emit('markOrderPaid', order)">标记已付款</button>
                                <button class="delete-btn" @click="$emit('confirmDeleteOrder', order)">删除</button>
                            </div>
                        </div>
                        <div v-if="pendingOrders.length === 0" style="text-align:center; padding:40px; color:#8e9aaf;">暂无待付款订单</div>
                    </div>
                    <div v-if="orderTab === 'draft'">
                        <div v-for="order in draftOrders" :key="order.id" class="order-item">
                            <div class="order-header"><span class="order-no">{{ order.order_no }}</span><span class="order-status draft">工单</span></div>
                            <div class="order-customer">{{ order.customer_name || '未填写' }} {{ order.customer_phone || '' }}</div>
                            <div class="order-items">{{ $emit('formatOrderItems', order.items) }}</div>
                            <div class="order-total">合计: {{ order.total_quantity }}双</div>
                            <div class="order-actions">
                                <button class="confirm-btn" @click="$emit('confirmDraftOrder', order)">确认出库</button>
                                <button class="delete-btn" @click="$emit('confirmDeleteOrder', order)">删除</button>
                            </div>
                        </div>
                        <div v-if="draftOrders.length === 0" style="text-align:center; padding:40px; color:#8e9aaf;">暂无工单</div>
                    </div>
                </div>
            </div>
        </div>
    `
};