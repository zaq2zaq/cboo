export const CustomerSelector = {
    props: ['visible', 'active', 'customerSearch', 'selectedCustomer', 'filteredCustomersForSelector', 'tempSelectedCustomerId'],
    emits: ['close', 'update:customerSearch', 'toggleCustomerSelect', 'confirmCustomerSelection', 'openAddCustomerFromSelector', 'maskPhone'],
    template: `
        <div v-if="visible" class="modal-center" :class="{ active: active }" @click="$emit('close')">
            <div class="modal-card" @click.stop>
                <div class="modal-header"><span>选择客户</span><span style="cursor:pointer" @click="$emit('close')">✕</span></div>
                <div class="modal-body">
                    <input type="text" class="search-input" placeholder="搜索姓名/电话" :value="customerSearch" @input="$emit('update:customerSearch', $event.target.value)">
                    <div class="customer-list">
                        <template v-if="customerSearch.trim() === '' && selectedCustomer">
                            <div class="customer-list-item" @click="$emit('toggleCustomerSelect', selectedCustomer.id)">
                                <div class="custom-radio" :class="{ selected: tempSelectedCustomerId === selectedCustomer.id }"></div>
                                <div class="customer-info">
                                    <div class="customer-name-phone"><span class="customer-name">{{ selectedCustomer.name }}</span><span class="customer-phone">{{ $emit('maskPhone', selectedCustomer.phone) }}</span></div>
                                    <div class="customer-address">{{ selectedCustomer.address || '无地址' }}</div>
                                </div>
                            </div>
                        </template>
                        <template v-else-if="customerSearch.trim() === '' && !selectedCustomer">
                            <div class="empty-tip">搜索关键字查找</div>
                        </template>
                        <template v-else>
                            <div v-for="c in filteredCustomersForSelector" :key="c.id" class="customer-list-item" @click="$emit('toggleCustomerSelect', c.id)">
                                <div class="custom-radio" :class="{ selected: tempSelectedCustomerId === c.id }"></div>
                                <div class="customer-info">
                                    <div class="customer-name-phone"><span class="customer-name">{{ c.name }}</span><span class="customer-phone">{{ $emit('maskPhone', c.phone) }}</span></div>
                                    <div class="customer-address">{{ c.address || '无地址' }}</div>
                                </div>
                            </div>
                            <div v-if="filteredCustomersForSelector.length === 0 && customerSearch.trim() !== ''" class="empty-tip">暂无匹配客户，请添加</div>
                        </template>
                    </div>
                </div>
                <div class="modal-footer"><button class="btn-confirm" @click="$emit('confirmCustomerSelection')">确定</button><button class="btn-cancel" @click="$emit('openAddCustomerFromSelector')">添加客户</button></div>
            </div>
        </div>
    `
};