export default `
<div v-if="addCustomerVisible" class="modal-center" :class="{ active: addCustomerActive }" @click="closeAddCustomer">
    <div class="modal-card" @click.stop style="max-width: 320px;">
        <div class="modal-header"><span>添加客户</span><span style="cursor:pointer" @click="closeAddCustomer">✕</span></div>
        <div class="modal-body" style="padding:16px;">
            <input type="text" placeholder="姓名" v-model="newCustomer.name" class="search-input" style="margin-bottom:12px;">
            <input type="tel" placeholder="电话" v-model="newCustomer.phone" class="search-input" style="margin-bottom:12px;">
            <input type="text" placeholder="地址" v-model="newCustomer.address" class="search-input">
        </div>
        <div class="modal-footer" style="justify-content: center;"><button class="btn-confirm" @click="saveCustomer">保存</button><button class="btn-cancel" @click="closeAddCustomer">取消</button></div>
    </div>
</div>
`;