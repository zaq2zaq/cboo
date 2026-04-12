export const ConfirmModal = {
    props: ['visible', 'active', 'title', 'message'],
    emits: ['close', 'resolve'],
    template: `
        <div v-if="visible" class="modal-center" :class="{ active: active }" @click="$emit('close')">
            <div class="modal-card" @click.stop style="max-width: 300px;">
                <div class="modal-header"><span>{{ title }}</span><span style="cursor:pointer" @click="$emit('close')">✕</span></div>
                <div class="modal-body" style="padding: 20px; text-align: center;">{{ message }}</div>
                <div class="modal-footer" style="justify-content: center;"><button class="btn-confirm" @click="$emit('resolve', true)">确定</button><button class="btn-cancel" @click="$emit('resolve', false)">取消</button></div>
            </div>
        </div>
    `
};