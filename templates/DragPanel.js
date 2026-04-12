export default `
<div class="container-2" :class="{ 'expanded-down': isExpanded, dragging: isDragging }" :style="{ top: dynamicContainer2Top + 'px', height: container2Height + 'px' }">
    <div class="drag-handle" v-if="!searchActive">
        <div class="click-area" @click="toggleExpand"></div>
        <div class="drag-arrow"><svg viewBox="0 0 1024 1024"><path d="M231.424 346.208a32 32 0 0 0-46.848 43.584l297.696 320a32 32 0 0 0 46.4 0.48l310.304-320a32 32 0 1 0-45.952-44.544l-286.848 295.808-274.752-295.36z" fill="#8e9aaf"></path></svg></div>
        <span>{{ isExpanded ? '收起看板' : '展开看板' }}</span>
    </div>
    <div class="card-panel">
        <div class="blue-card-fixed" v-if="!searchActive" ref="blueCardRef" :style="{ marginTop: blueCardMarginTop + 'px' }">
            <div class="four-stats-blue"><div class="blue-stat-item"><div class="blue-number">6</div><div class="blue-label">待收款</div></div><div class="blue-stat-item"><div class="blue-number">12</div><div class="blue-label">待拣货</div></div><div class="blue-stat-item"><div class="blue-number">4</div><div class="blue-label">待出库</div></div><div class="blue-stat-item"><div class="blue-number">2</div><div class="blue-label">待调拨</div></div></div>
            <div class="warning-inline"><div class="warning-item"><div class="warning-icon-svg"><svg viewBox="0 0 1024 1024"><path d="M864 117.333333l0.021333 474.752A223.594667 223.594667 0 0 1 949.333333 768c0 123.712-100.288 224-224 224-61.013333 0-116.352-24.405333-156.757333-64H160v-810.666667h704z m-138.666667 490.666667a160 160 0 1 0 0 320 160 160 0 0 0 0-320z m74.666667-426.666667h-576v682.666667h298.88A223.146667 223.146667 0 0 1 501.333333 768c0-123.712 100.288-224 224-224 26.176 0 51.306667 4.48 74.666667 12.757333V181.333333zM725.333333 661.333333l31.36 63.509334 70.08 10.197333-50.709333 49.450667 11.946667 69.802666L725.333333 821.333333l-62.698666 32.96 11.968-69.802666-50.709334-49.450667 70.101334-10.197333L725.333333 661.333333z m-256-85.333333v64h-149.333333v-64h149.333333z m234.666667-149.333333v64H320v-64h384z m0-149.333334v64H320v-64h384z" fill="#FFFFFF"></path></svg></div>工单 <span class="warning-num">1</span></div><div class="warning-item"><div class="warning-icon-svg"><svg viewBox="0 0 1024 1024"><path d="M512 96c229.76 0 416 186.24 416 416S741.76 928 512 928 96 741.76 96 512 282.24 96 512 96z m0 64C317.589333 160 160 317.589333 160 512S317.589333 864 512 864 864 706.410667 864 512 706.410667 160 512 160z m0 155.904L708.096 512 512 708.096 315.904 512 512 315.904z m0 90.517333l-105.6 105.6L512 617.6 617.557333 512l-105.6-105.6z" fill="#FFFFFF"></path></svg></div>回款预警 <span class="warning-num">2</span></div></div>
        </div>
        <div class="scrollable-content" ref="scrollableRef">
            <div class="announcement-area" v-if="!searchActive"><div class="announcement-inner"><div class="announce-left"><div class="announce-icon-svg"><svg viewBox="0 0 1024 1024"><path d="M678 464.9H316.8c-11.1 0-20.1 9-20.1 20.1 0 11.1 9 20.1 20.1 20.1H678c11.1 0 20.1-9 20.1-20.1 0-11.2-9-20.1-20.1-20.1zM678 585.3H316.8c-11.1 0-20.1 9-20.1 20.1 0 11.1 9 20.1 20.1 20.1H678c11.1 0 20.1-9 20.1-20.1 0-11.2-9-20.1-20.1-20.1z" fill="#FFFFFF"></path><path d="M818.5 282.3H647.7l-82.1-115.9c-1.2-1.6-2.5-3.1-4.1-4.4-35.9-29.2-92.3-29.2-128.2 0-1.5 1.3-2.9 2.7-4.1 4.4l-82.1 115.9H176.3c-5.8 0-11.4 2.3-15.6 6.4s-6.4 9.7-6.4 15.6v441.5c0 12.1 9.8 22 22 22h642.1c12.2 0 22-9.9 22-22V304.3c0.1-12.1-9.7-22-21.9-22z m-355.3-87.7c19.2-13.8 49.2-13.8 68.4 0l62.1 87.7H401.1l62.1-87.7z m333.3 529.2H198.3V326.3H316l-37.2 52.5c-7 9.9-4.7 23.6 5.2 30.7 3.9 2.7 8.3 4 12.7 4 6.9 0 13.7-3.2 18-9.3l55.2-78h255l55.2 78c7 9.9 20.8 12.3 30.7 5.2 9.9-7 12.2-20.8 5.2-30.7l-37.2-52.5h117.6v397.6z" fill="#FFFFFF"></path></svg></div><span class="announce-title">公告</span><span class="announce-text">主图点击最高提升30%，"素材测试"全新…</span></div><div class="announce-right"><div class="badge-red">3</div><i class="fas fa-chevron-right"></i></div></div></div>
            <div class="product-full-section">
                <ProductList :products="filteredProducts" :show-detail="showDetail" :swipe-offset="swipeOffset" :swipe-actions-right="swipeActionsRight" :copy-highlight="copyHighlight"
                    @touch-start="onTouchStart" @touch-move="onTouchMove" @touch-end="onTouchEnd" @toggle-detail="toggleDetail" @open-sale="openSaleSheet" @open-stock-in="openStockInSheet" @copy-size="copySizeInfo" />
                <div class="extra-bottom-space"></div>
            </div>
        </div>
    </div>
</div>
`;
