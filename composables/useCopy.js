import { ref } from 'vue';
import { utils } from '../utils.js';

export function useCopy(showToast) {
    const copyHighlight = ref({});
    async function copySizeInfo(product, event) {
        const pid = product.id; copyHighlight.value[pid] = true; setTimeout(() => { copyHighlight.value[pid] = false; }, 1000);
        let lines = [`${product.sku} · (${utils.getProductTotalStock(product)}双)`];
        for (let color of product.colors) { lines.push(`${color.name}${utils.getColorTotal(color)}双`); lines.push(utils.parseSizeRange(color.sizeRange).map(d => `${d}/${utils.getStockForColor(color, d)}`).join(', ')); }
        const text = lines.join('\n');
        if (navigator.clipboard && window.isSecureContext) { try { await navigator.clipboard.writeText(text); showToast('库存信息已复制'); return; } catch (err) {} }
        const textarea = document.createElement('textarea'); textarea.value = text; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); document.body.removeChild(textarea); showToast('库存信息已复制');
    }
    return { copyHighlight, copySizeInfo };
}