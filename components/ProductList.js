export const ProductList = {
    props: ['products', 'showDetail', 'swipeOffset', 'swipeActionsRight', 'copyHighlight'],
    emits: ['touchStart', 'touchMove', 'touchEnd', 'toggleDetail', 'openSale', 'openStockIn', 'copySize'],
    setup() {
        const getProductTotalStock = inject('getProductTotalStock');
        const parseSizeRange = inject('parseSizeRange');
        const getColorTotal = inject('getColorTotal');
        const getStockForColor = inject('getStockForColor');
        return { getProductTotalStock, parseSizeRange, getColorTotal, getStockForColor };
    },
    template: `
        <div class="product-list">
            <div v-for="product in products" :key="product.id" class="swipe-container">
                <div class="product-item" :style="{ transform: swipeOffset[product.id] ? 'translateX(-' + swipeOffset[product.id] + 'px)' : 'translateX(0)' }"
                    @touchstart="$emit('touchStart', $event, product.id)" @touchmove="$emit('touchMove', $event, product.id)" @touchend="$emit('touchEnd', $event, product.id)">
                    <div class="product-main">
                        <div class="product-img"><i class="fas fa-shoe-prints"></i></div>
                        <div class="product-details"><div class="product-sku-name">货号: {{ product.sku }} · {{ product.name }}</div><div class="product-tags"><span v-for="tag in product.tags" class="tag">{{ tag }}</span></div></div>
                        <div class="product-quantity">{{ getProductTotalStock(product) }}双</div>
                    </div>
                    <button class="toggle-size-btn" :class="{ open: showDetail[product.id] }" @click.stop="$emit('toggleDetail', product.id)"><i class="fas fa-chevron-down"></i> {{ showDetail[product.id] ? '收起尺码库存' : '查看尺码库存' }}</button>
                    <div class="size-detail" :class="{ show: showDetail[product.id] }" @click.stop>
                        <div class="size-table">
                            <button class="copy-size-btn" :class="{ highlight: copyHighlight[product.id] }" @click.stop="$emit('copySize', product, $event)"><svg viewBox="0 0 1024 1024"><path d="M736 800c-35.296 0-64-28.704-64-64s28.704-64 64-64 64 28.704 64 64-28.704 64-64 64M288 576c-35.296 0-64-28.704-64-64s28.704-64 64-64 64 28.704 64 64-28.704 64-64 64M736 224c35.296 0 64 28.704 64 64s-28.704 64-64 64-64-28.704-64-64 28.704-64 64-64m0 384a127.776 127.776 0 0 0-115.232 73.28l-204.896-117.056a30.848 30.848 0 0 0-9.696-3.2A127.68 127.68 0 0 0 416 512c0-6.656-0.992-13.088-1.984-19.456 0.608-0.32 1.28-0.416 1.856-0.768l219.616-125.472A127.328 127.328 0 0 0 736 416c70.592 0 128-57.408 128-128s-57.408-128-128-128-128 57.408-128 128c0 6.72 0.992 13.152 1.984 19.616-0.608 0.288-1.28 0.256-1.856 0.608l-219.616 125.472A127.328 127.328 0 0 0 288 384c-70.592 0-128 57.408-128 128s57.408 128 128 128a126.912 126.912 0 0 0 84.544-32.64 31.232 31.232 0 0 0 11.584 12.416l224 128c0.352 0.224 0.736 0.256 1.12 0.448C615.488 812.992 669.6 864 736 864c70.592 0 128-57.408 128-128s-57.408-128-128-128" fill="currentColor"></path></svg> 复制</button>
                            <div v-for="color in product.colors" class="color-row"><div class="color-name"><span>{{ color.name }}</span><span class="color-total">{{ getColorTotal(color) }}双</span></div>
                                <div class="size-badge-group"><div v-for="digit in parseSizeRange(color.sizeRange)" class="size-badge"><span class="digit">{{ digit }}</span><span class="slash">/</span><span class="stock">{{ getStockForColor(color, digit) }}</span></div></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="swipe-actions" :style="{ right: swipeActionsRight[product.id] ? '0' : '-152px' }">
                    <button class="swipe-action-btn out" @click.stop="$emit('openSale', product)">出库</button>
                    <button class="swipe-action-btn in" @click.stop="$emit('openStockIn', product)">入库</button>
                </div>
            </div>
        </div>
    `
};