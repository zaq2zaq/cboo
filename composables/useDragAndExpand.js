import { ref, computed, watch, nextTick } from 'vue';

export function useDragAndExpand(searchActive) {
    const isExpanded = ref(false);
    const isDragging = ref(false);
    const dragOffset = ref(0);
    const blueCardMarginTop = ref(0);
    const container2Top = ref(0);
    const container2Height = ref(0);
    const scrollableRef = ref(null);
    const dynamicTop = ref(0);
    
    const computeAndSetPosition = () => {
        const kpi = document.querySelector('.kpi-flat-row');
        if (kpi) {
            const rect = kpi.getBoundingClientRect();
            container2Top.value = rect.bottom;
            let h = window.innerHeight - rect.bottom;
            if (h < 100) h = 100;
            container2Height.value = h;
        } else {
            // 降级：如果获取不到KPI，使用默认值
            container2Top.value = 120;
            container2Height.value = window.innerHeight - 120;
        }
        updateDynamicTop();
    };
    
    const updateDynamicTop = () => {
        if (searchActive.value) {
            const panel = document.querySelector('.search-panel');
            if (panel) {
                dynamicTop.value = panel.getBoundingClientRect().bottom;
            } else {
                dynamicTop.value = container2Top.value + 200;
            }
        } else {
            dynamicTop.value = container2Top.value;
        }
    };
    
    const setMarginFromOffset = (o) => {
        let m = Math.min(Math.max(o, 0), 180);
        blueCardMarginTop.value = m;
        dragOffset.value = o;
    };
    
    let ty = 0, so = 0;
    const onTouchStartDrag = (e) => {
        if (isExpanded.value || searchActive.value) return;
        isDragging.value = true;
        ty = e.touches[0].clientY;
        so = dragOffset.value;
        e.preventDefault();
    };
    const onTouchMoveDrag = (e) => {
        if (!isDragging.value || isExpanded.value || searchActive.value) return;
        let d = e.touches[0].clientY - ty;
        let no = so + d;
        if (no < 0) no = 0;
        if (no > 180) no = 180;
        setMarginFromOffset(no);
        e.preventDefault();
    };
    const onTouchEndDrag = () => {
        if (!isDragging.value || isExpanded.value || searchActive.value) {
            isDragging.value = false;
            return;
        }
        isDragging.value = false;
        if (dragOffset.value >= 70) {
            isExpanded.value = true;
            setMarginFromOffset(180);
        } else {
            setMarginFromOffset(0);
            isExpanded.value = false;
        }
        computeAndSetPosition();
    };
    
    let sy = 0, sso = 0, isd = false;
    const onScrollableTouchStart = (e) => {
        if (isExpanded.value || searchActive.value) return;
        if (scrollableRef.value && scrollableRef.value.scrollTop === 0) {
            sy = e.touches[0].clientY;
            sso = dragOffset.value;
            isd = true;
            isDragging.value = true;
        }
    };
    const onScrollableTouchMove = (e) => {
        if (!isd || isExpanded.value || searchActive.value) return;
        let d = e.touches[0].clientY - sy;
        if (d > 0 && scrollableRef.value.scrollTop === 0) {
            let no = sso + d;
            if (no < 0) no = 0;
            if (no > 180) no = 180;
            setMarginFromOffset(no);
            e.preventDefault();
        } else {
            isd = false;
            isDragging.value = false;
        }
    };
    const onScrollableTouchEnd = () => {
        if (isd && !isExpanded.value && !searchActive.value) {
            if (dragOffset.value >= 70) {
                isExpanded.value = true;
                setMarginFromOffset(180);
            } else {
                setMarginFromOffset(0);
                isExpanded.value = false;
            }
            computeAndSetPosition();
        }
        isd = false;
        isDragging.value = false;
    };
    
    const toggleExpand = () => {
        // 移除 searchActive 限制，允许搜索激活时也能点击收起/展开
        if (isExpanded.value) {
            isExpanded.value = false;
            setMarginFromOffset(0);
        } else {
            isExpanded.value = true;
            setMarginFromOffset(180);
        }
        computeAndSetPosition();
    };
    
    const forceCollapse = () => {
        if (isExpanded.value) {
            isExpanded.value = false;
            dragOffset.value = 0;
            blueCardMarginTop.value = 0;
            computeAndSetPosition();
        }
        isDragging.value = false;
    };
    
    const searchPanelHeight = ref(200);
    const updateSearchPanelHeight = () => {
        nextTick(() => {
            const panel = document.querySelector('.search-panel');
            if (panel) {
                searchPanelHeight.value = panel.offsetHeight;
                updateDynamicTop();
            }
        });
    };
    
    watch(searchActive, (val) => {
        if (val) {
            updateSearchPanelHeight();
        } else {
            // 关闭搜索时，等待DOM更新后再计算位置
            nextTick(() => {
                computeAndSetPosition();
            });
        }
    });
    
    const handleResize = () => {
        computeAndSetPosition();
        if (searchActive.value) updateSearchPanelHeight();
    };
    
    return {
        isExpanded,
        isDragging,
        blueCardMarginTop,
        container2Top,
        container2Height,
        scrollableRef,
        dynamicTop,
        onTouchStartDrag,
        onTouchMoveDrag,
        onTouchEndDrag,
        onScrollableTouchStart,
        onScrollableTouchMove,
        onScrollableTouchEnd,
        toggleExpand,
        forceCollapse,
        computeAndSetPosition: handleResize,
        searchPanelHeight,
        updateSearchPanelHeight,
        updateDynamicTop,
    };
}