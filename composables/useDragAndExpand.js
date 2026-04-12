import { ref, computed, watch, nextTick } from 'vue';

export function useDragAndExpand(searchActive) {
    const isExpanded = ref(false); const isDragging = ref(false); const dragOffset = ref(0);
    const blueCardMarginTop = ref(0); const container2Top = ref(0); const container2Height = ref(0);
    const scrollableRef = ref(null);
    
    const computeAndSetPosition = () => {
        const kpi = document.querySelector('.kpi-flat-row');
        if (kpi) { const rect = kpi.getBoundingClientRect(); container2Top.value = rect.bottom; let h = window.innerHeight - rect.bottom; if (h < 100) h = 100; container2Height.value = h; }
    };
    const setMarginFromOffset = (o) => { let m = Math.min(Math.max(o, 0), 180); blueCardMarginTop.value = m; dragOffset.value = o; };
    
    let ty = 0, so = 0;
    const onTouchStartDrag = (e) => { if (isExpanded.value) return; isDragging.value = true; ty = e.touches[0].clientY; so = dragOffset.value; e.preventDefault(); };
    const onTouchMoveDrag = (e) => { if (!isDragging.value || isExpanded.value) return; let d = e.touches[0].clientY - ty; let no = so + d; if (no < 0) no = 0; if (no > 180) no = 180; setMarginFromOffset(no); e.preventDefault(); };
    const onTouchEndDrag = () => { if (!isDragging.value || isExpanded.value) { isDragging.value = false; return; } isDragging.value = false; if (dragOffset.value >= 70) { isExpanded.value = true; setMarginFromOffset(180); } else { setMarginFromOffset(0); isExpanded.value = false; } computeAndSetPosition(); };
    
    let sy = 0, sso = 0, isd = false;
    const onScrollableTouchStart = (e) => { if (isExpanded.value || searchActive.value) return; if (scrollableRef.value && scrollableRef.value.scrollTop === 0) { sy = e.touches[0].clientY; sso = dragOffset.value; isd = true; isDragging.value = true; } };
    const onScrollableTouchMove = (e) => { if (!isd || isExpanded.value || searchActive.value) return; let d = e.touches[0].clientY - sy; if (d > 0 && scrollableRef.value.scrollTop === 0) { let no = sso + d; if (no < 0) no = 0; if (no > 180) no = 180; setMarginFromOffset(no); e.preventDefault(); } else { isd = false; isDragging.value = false; } };
    const onScrollableTouchEnd = () => { if (isd && !isExpanded.value && !searchActive.value) { if (dragOffset.value >= 70) { isExpanded.value = true; setMarginFromOffset(180); } else { setMarginFromOffset(0); isExpanded.value = false; } computeAndSetPosition(); } isd = false; isDragging.value = false; };
    const toggleExpand = () => { if (isExpanded.value) { isExpanded.value = false; setMarginFromOffset(0); } else { isExpanded.value = true; setMarginFromOffset(180); } computeAndSetPosition(); };
    
    const searchPanelHeight = ref(200);
    const updateSearchPanelHeight = () => { nextTick(() => { const panel = document.querySelector('.search-panel'); if (panel) searchPanelHeight.value = panel.offsetHeight; }); };
    const dynamicContainer2Top = computed(() => {
        if (searchActive.value) { const panel = document.querySelector('.search-panel'); if (panel) return panel.getBoundingClientRect().bottom; return 180; }
        return container2Top.value;
    });
    watch(searchActive, (val) => { if (val) updateSearchPanelHeight(); });
    
    return { isExpanded, isDragging, blueCardMarginTop, container2Top, container2Height, scrollableRef, onTouchStartDrag, onTouchMoveDrag, onTouchEndDrag, onScrollableTouchStart, onScrollableTouchMove, onScrollableTouchEnd, toggleExpand, computeAndSetPosition, searchPanelHeight, updateSearchPanelHeight, dynamicContainer2Top };
}