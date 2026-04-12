export const AddCustomerModal = {
    props: ['visible', 'active', 'newCustomer'],
    emits: ['close', 'update:newCustomer', 'saveCustomer'],
    template: `
        <div v-if="visible" class="modal-center" :class="{ active: active }" @click="$emit('close')">
            <div class="modal-card" @click.stop style="max-width: 320px;">
                <div class="modal-header"><span>添加客户</span><span style="cursor:pointer" @click="$emit('close')">✕</span></div>
                <div class="modal-body" style="padding:16px;">
                    <input type="text" placeholder="姓名" :value="newCustomer.name" @input="$emit('update:newCustomer', { ...newCustomer, name: $event.target.value })" class="search-input" style="margin-bottom:12px;">
                    <input type="tel" placeholder="电话" :value="newCustomer.phone" @input="$emit('update:newCustomer', { ...newCustomer, phone: $event.target.value })" class="search-input" style="margin-bottom:12px;">
                    <input type="text" placeholder="地址" :value="newCustomer.address" @input="$emit('update:newCustomer', { ...newCustomer, address: $event.target.value })" class="search-input">
                </div>
                <div class="modal-footer" style="justify-content: center;"><button class="btn-confirm" @click="$emit('saveCustomer')">保存</button><button class="btn-cancel" @click="$emit('close')">取消</button></div>
            </div>
        </div>
    `
};