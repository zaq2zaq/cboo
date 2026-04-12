export default `
<div v-if="batchModalVisible" class="modal-center" :class="{ active: batchModalActive }" @click="closeBatchModal">
    <div class="modal-card" @click.stop style="max-width: 420px;">
        <div class="modal-header"><span>批量入库</span><span style="cursor:pointer" @click="closeBatchModal">✕</span></div>
        <div class="modal-body" style="padding: 16px;">
            <textarea class="batch-textarea" placeholder="自由格式示例：&#10;34-39&#10;5 6 12 34 12 1&#10;34-36 38-40&#10;7 6 8 9 10 1&#10;## 34 35 36&#10;3 6 7&#10;* 5 5 5 5 5&#10;# 跳过颜色" v-model="batchPattern"></textarea>
            <div class="empty-tip" style="padding: 8px 0; font-size: 11px;">支持区间 34-39、枚举、混合。# 跳过颜色，连续 ## 跳过两个。* 表示默认尺码（可同行跟数量或换行）。</div>
        </div>
        <div class="modal-footer"><button class="btn-confirm" @click="applyBatch">应用</button><button class="btn-cancel" @click="closeBatchModal">取消</button></div>
    </div>
</div>
`;