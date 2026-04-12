export const BatchModal = {
    props: ['visible', 'active', 'batchPattern'],
    emits: ['close', 'update:batchPattern', 'applyBatch'],
    template: `
        <div v-if="visible" class="modal-center" :class="{ active: active }" @click="$emit('close')">
            <div class="modal-card" @click.stop style="max-width: 420px;">
                <div class="modal-header"><span>批量入库</span><span style="cursor:pointer" @click="$emit('close')">✕</span></div>
                <div class="modal-body" style="padding: 16px;">
                    <textarea class="batch-textarea" placeholder="自由格式示例：&#10;34-39&#10;5 6 12 34 12 1&#10;34-36 38-40&#10;7 6 8 9 10 1&#10;## 34 35 36&#10;3 6 7&#10;* 5 5 5 5 5&#10;# 跳过颜色" :value="batchPattern" @input="$emit('update:batchPattern', $event.target.value)"></textarea>
                    <div class="empty-tip" style="padding: 8px 0; font-size: 11px;">支持区间 34-39、枚举、混合。# 跳过颜色，连续 ## 跳过两个。* 表示默认尺码（可同行跟数量或换行）。</div>
                </div>
                <div class="modal-footer"><button class="btn-confirm" @click="$emit('applyBatch')">应用</button><button class="btn-cancel" @click="$emit('close')">取消</button></div>
            </div>
        </div>
    `
};