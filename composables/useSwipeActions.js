import { ref } from 'vue';

export function useSwipeActions(productList) {
    const swipeOffset = ref({}); const swipeActionsRight = ref({}); const showDetail = ref({});
    let touchStartX = 0, currentProductId = null; const SWIPE_THRESHOLD = 50, ACTION_WIDTH = 152;
    function closeAllSwipes() { productList.value.forEach(p => { swipeOffset.value[p.id] = 0; swipeActionsRight.value[p.id] = false; }); }
    function onTouchStart(e, pid) { touchStartX = e.touches[0].clientX; currentProductId = pid; }
    function onTouchMove(e, pid) { if (currentProductId !== pid) return; const deltaX = e.touches[0].clientX - touchStartX; if (deltaX < 0) { let offset = Math.min(-deltaX, ACTION_WIDTH); if (offset < 10) offset = 0; swipeOffset.value[pid] = offset; } else if (deltaX > 0) swipeOffset.value[pid] = 0; }
    function onTouchEnd(e, pid) { if (currentProductId !== pid) return; const finalOffset = swipeOffset.value[pid]; if (finalOffset > SWIPE_THRESHOLD) { swipeOffset.value[pid] = ACTION_WIDTH; swipeActionsRight.value[pid] = true; } else { swipeOffset.value[pid] = 0; swipeActionsRight.value[pid] = false; } currentProductId = null; }
    function toggleDetail(pid) { showDetail.value[pid] = !showDetail.value[pid]; }
    return { swipeOffset, swipeActionsRight, showDetail, closeAllSwipes, onTouchStart, onTouchMove, onTouchEnd, toggleDetail };
}