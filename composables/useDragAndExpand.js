import { ref, nextTick } from 'vue';

export function useDragAndExpand(searchActive) {
    const isExpanded = ref(false);
    const isDragging = ref(false);
    const dragOffset = ref(0);
    const blueCardMarginTop = ref(0);
    const container2Top = ref(0);
    const container2Height = ref(0);
    const scrollableRef = ref(null);
    const dynamicTop = ref(0);
    
    // 缓存搜索面板底部位置
    let searchPanelBottom = 0;
    
    // 计算 KPI 区域底部位置和容器高度
    const computeContainer2Position = () => {
        const kpi = document.querySelector('.kpi-flat-row');
        if (kpi) {
            const rect = kpi.getBoundingClientRect();
            container2Top.value = rect.bottom;
            let h = window.innerHeight - rect.bottom;
            if (h < 100) h = 100;
            container2Height.value = h;
        } else {
            container2Top.value = 120;
            container2Height.value = window.innerHeight - 120;
        }
    };
    
    // 更新 dynamicTop：根据搜索面板状态
    const updateDynamicTop = () => {
        if (searchActive.value && searchPanelBottom > 0) {
            dynamicTop.value = searchPanelBottom;
        } else {
            dynamicTop.value = container2Top.value;
        }
    };
    
    // 搜索面板进入动画结束后调用
    const onSearchPanelAfterEnter = () => {
        const panel = document.querySelector('.search-panel');
        if (panel) {
            searchPanelBottom = panel.getBoundingClientRect().bottom;
            updateDynamicTop();
        }
    };
    
    // 搜索面板离开动画结束后调用
    const onSearchPanelAfterLeave = () => {
        computeContainer2Position();
        updateDynamicTop();
    };
    
    // 历史面板高度变化时（无动画）调用
    const updateSearchPanelHeight = () => {
        if (searchActive.value) {
            const panel = document.querySelector('.search-panel');
            if (panel) {
                searchPanelBottom = panel.getBoundingClientRect().bottom;
                updateDynamicTop();
            }
        }
    };
    
    // 拖拽相关逻辑
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
        computeContainer2Position();
        updateDynamicTop();
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
            computeContainer2Position();
            updateDynamicTop();
        }
        isd = false;
        isDragging.value = false;
    };
    
    const toggleExpand = () => {
        if (isExpanded.value) {
            isExpanded.value = false;
            setMarginFromOffset(0);
        } else {
            isExpanded.value = true;
            setMarginFromOffset(180);
        }
        computeContainer2Position();
        updateDynamicTop();
    };
    
    const forceCollapse = () => {
        if (isExpanded.value) {
            isExpanded.value = false;
            dragOffset.value = 0;
            blueCardMarginTop.value = 0;
            computeContainer2Position();
            updateDynamicTop();
        }
        isDragging.value = false;
    };
    
    const handleResize = () => {
        computeContainer2Position();
        if (searchActive.value && searchPanelBottom > 0) {
            updateDynamicTop();
        } else {
            updateDynamicTop();
        }
    };
    
    // 初始化
    computeContainer2Position();
    updateDynamicTop();
    
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
        updateSearchPanelHeight,
        onSearchPanelAfterEnter,
        onSearchPanelAfterLeave,
    };
}