export default `
<div v-if="toastVisible" class="toast-message">{{ toastMessage }}</div>
<div v-if="confirmVisible" class="modal-center" :class="{ active: confirmActive }" @click="closeConfirm">
    <div class="modal-card" @click.stop style="max-width: 300px;">
        <div class="modal-header"><span>{{ confirmTitle }}</span><span style="cursor:pointer" @click="closeConfirm">✕</span></div>
        <div class="modal-body" style="padding: 20px; text-align: center;">{{ confirmMessage }}</div>
        <div class="modal-footer" style="justify-content: center;"><button class="btn-confirm" @click="confirmResolve(true)">确定</button><button class="btn-cancel" @click="confirmResolve(false)">取消</button></div>
    </div>
</div>
`;