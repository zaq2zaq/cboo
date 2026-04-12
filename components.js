import { ref, computed, watch, nextTick, inject } from 'vue';
import { utils } from './utils.js';

// 头部组件
export const AppHeader = {
    props: ['shopName'],
    emits: ['toggleSidebar', 'search', 'scan', 'add'],
    template: `
        <div class="head">
            <div class="div-left" @click="$emit('toggleSidebar')">
                <button class="menu-btn"><svg viewBox="0 0 1024 1024"><path d="M512 320c23.616 0 44.032-12.96 55.136-32 5.472-9.44 8.864-20.288 8.864-32a64 64 0 1 0-128 0c0 11.712 3.392 22.56 8.864 32 11.104 19.04 31.52 32 55.136 32M512 448c-23.616 0-44.032 12.96-55.136 32A63.584 63.584 0 0 0 448 512c0 11.712 3.392 22.56 8.864 32 11.104 19.04 31.52 32 55.136 32 23.616 0 44.032-12.96 55.136-32 5.472-9.44 8.864-20.288 8.864-32s-3.392-22.56-8.864-32c-11.104-19.04-31.52-32-55.136-32M512 704c-23.616 0-44.032 12.96-55.136 32A63.584 63.584 0 0 0 448 768a64 64 0 1 0 128 0c0-11.712-3.392-22.56-8.864-32-11.104-19.04-31.52-32-55.136-32" fill="#1e2a3a"></path></svg></button>
                <div class="logo-wrapper"><div class="logo-svg"><svg viewBox="0 0 1024 1024"><path d="M815.40608 280.5248H206.48448L143.27808 445.9264c0 49.51552 41.088 90.5984 91.65312 90.5984s92.70784-40.03328 92.70784-90.5984c0 49.51552 41.088 90.5984 91.65312 90.5984S512 496.49152 512 445.9264c0 49.51552 41.088 90.5984 91.65312 90.5984s91.65312-40.03328 91.65312-90.5984c0 49.51552 41.088 90.5984 92.70784 90.5984 50.56512 0 92.70784-40.03328 92.70784-90.5984L815.40608 280.5248z m-50.57024 284.44672v210.69824H259.16416v-210.69824H206.4896v221.2352c0 18.96448 21.0688 42.1376 40.03328 42.1376h529.90464c18.96448 0 40.03328-23.17824 40.03328-42.1376v-221.2352h-51.62496z m50.57024-285.49632l2.10944 1.05472-2.10944-1.05472zM248.6272 238.3872h526.7456c17.90976 0 31.60576-13.696 31.60576-31.60576s-13.696-31.60576-31.60576-31.60576H248.6272c-17.90976 0-31.60576 13.696-31.60576 31.60576s13.696 31.60576 31.60576 31.60576z" fill="white"></path></svg></div></div>
                <div class="shop-name">{{ shopName }}</div>
            </div>
            <div class="div-right">
                <div class="icon-svg" @click="$emit('search')"><svg viewBox="0 0 1024 1024"><path d="M192 480a256 256 0 1 1 512 0 256 256 0 0 1-512 0m631.776 362.496l-143.2-143.168A318.464 318.464 0 0 0 768 480c0-176.736-143.264-320-320-320S128 303.264 128 480s143.264 320 320 320a318.016 318.016 0 0 0 184.16-58.592l146.336 146.368c12.512 12.48 32.768 12.48 45.28 0 12.48-12.512 12.48-32.768 0-45.28" fill="#1e2a3a"></path></svg></div>
                <div class="icon-svg" @click="$emit('scan')"><svg viewBox="0 0 1024 1024"><path d="M832 480H192a32 32 0 0 0 0 64h640a32 32 0 0 0 0-64M800.256 160H223.712a63.808 63.808 0 0 0-63.68 63.744V384a32 32 0 1 0 64 0l-0.32-160 576.32-0.256V384a32 32 0 1 0 64 0V223.744A63.84 63.84 0 0 0 800.224 160M832 608a32 32 0 0 0-32 32l0.256 160L224 800.256V640a32 32 0 0 0-64 0v160.256C160 835.392 188.608 864 223.744 864h576.512A63.84 63.84 0 0 0 864 800.256V640a32 32 0 0 0-32-32" fill="#1e2a3a"></path></svg></div>
                <div class="add-icon" @click="$emit('add')"><svg viewBox="0 0 20 20"><path d="M10 1.22943C5.15604 1.22943 1.22943 5.15604 1.22943 10C1.22943 11.3437 1.53197 12.6189 2.07365 13.7592L2.40679 14.4596L3.80656 13.7942L3.47436 13.0939L3.31631 12.7371C2.97057 11.8938 2.77968 10.97 2.77968 10C2.77968 6.01243 6.01243 2.77968 10 2.77968C13.9876 2.77968 17.2203 6.01243 17.2203 10C17.2203 13.9876 13.9876 17.2203 10 17.2203C9.18341 17.2203 8.58586 17.1622 8.05603 17.0159C7.53403 16.8717 7.03891 16.6305 6.44615 16.2171C5.5775 15.6112 4.3323 15.3975 3.3059 16.0458L3.28981 16.0562L3.27372 16.0676L2.5904 16.5484L3.10431 18.0825L4.14444 17.35C4.51837 17.1207 5.07302 17.1507 5.5584 17.4891C6.26064 17.9789 6.91506 18.3092 7.64339 18.5103C8.36397 18.7093 9.11785 18.7706 10 18.7706C14.844 18.7706 18.7706 14.844 18.7706 10C18.7706 5.15604 14.844 1.22943 10 1.22943ZM9.2192 6.36949V9.22487H6.36949V10.7751H9.2192V13.6305H10.7694V10.7751H13.6305V9.22487H10.7694V6.36949H9.2192Z" fill="currentColor"></path></svg></div>
            </div>
        </div>
    `
};

// 商品列表组件
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

// 搜索面板组件
export const SearchPanel = {
    props: ['modelValue'],
    emits: ['update:modelValue', 'close', 'filter-change', 'sort-change', 'search', 'panel-height-change'],
    setup(props, { emit }) {
        const searchText = ref('');
        const showFilterDropdown = ref(false);
        const showHistoryPanel = ref(false);
        const filterOptions = ['全部', '有库存', '热销'];
        const currentFilter = ref('全部');
        const sortOptions = ['综合', '销量', '价格', '最早'];
        const currentSort = ref('综合');
        
        const STORAGE_KEY = 'search_history';
        const history = ref([]);
        const loadHistory = () => { try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) history.value = JSON.parse(stored); } catch (e) { history.value = []; } };
        loadHistory();
        const saveHistory = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value)); } catch (e) {} };
        const addToHistory = (keyword) => { if (!keyword.trim()) return; history.value = [keyword, ...history.value.filter(h => h !== keyword)].slice(0, 10); saveHistory(); };
        const clearHistory = () => { history.value = []; saveHistory(); };
        const selectFilter = (opt) => { currentFilter.value = opt; showFilterDropdown.value = false; emit('filter-change', opt); };
        const selectSort = (sort) => { currentSort.value = sort; emit('sort-change', sort); };
        const onHistoryClick = (item) => { searchText.value = item; emit('search', item); showHistoryPanel.value = false; };
        const onSearchSubmit = () => { if (searchText.value.trim()) { addToHistory(searchText.value.trim()); emit('search', searchText.value); } };
        const onSearchInput = () => { emit('search', searchText.value); };
        
        const productCount = inject('filteredCount');
        
        watch(showHistoryPanel, () => { nextTick(() => emit('panel-height-change')); });
        
        return { searchText, showFilterDropdown, showHistoryPanel, filterOptions, currentFilter, sortOptions, currentSort, history, clearHistory, selectFilter, selectSort, onHistoryClick, onSearchSubmit, onSearchInput, productCount };
    },
    template: `
        <div class="search-panel">
            <div class="search-header">
                <div class="search-input-wrapper">
                    <svg viewBox="0 0 1024 1024"><path d="M192 480a256 256 0 1 1 512 0 256 256 0 0 1-512 0m631.776 362.496l-143.2-143.168A318.464 318.464 0 0 0 768 480c0-176.736-143.264-320-320-320S128 303.264 128 480s143.264 320 320 320a318.016 318.016 0 0 0 184.16-58.592l146.336 146.368c12.512 12.48 32.768 12.48 45.28 0 12.48-12.512 12.48-32.768 0-45.28"></path></svg>
                    <input type="text" v-model="searchText" placeholder="搜索商品名称、货号" @keyup.enter="onSearchSubmit" @input="onSearchInput" autofocus />
                </div>
                <span class="cancel-btn" @click="$emit('close')">取消</span>
            </div>
            <div class="filter-row">
                <div class="sort-row">
                    <div v-for="s in sortOptions" :key="s" class="sort-item" :class="{ active: currentSort === s }" @click="selectSort(s)">{{ s }}</div>
                </div>
                <div style="position: relative;">
                    <span class="filter-text" @click="showFilterDropdown = !showFilterDropdown">筛选</span>
                    <div v-if="showFilterDropdown" class="filter-dropdown">
                        <div v-for="opt in filterOptions" :key="opt" class="filter-dropdown-item" :class="{ active: currentFilter === opt }" @click="selectFilter(opt)">{{ opt }}</div>
                    </div>
                </div>
            </div>
            <div class="history-section">
                <div class="history-header">
                    <span class="history-title" @click="showHistoryPanel = !showHistoryPanel">历史</span>
                    <span class="history-count">共 {{ productCount }} 个商品</span>
                </div>
                <div v-show="showHistoryPanel" class="history-panel">
                    <div class="history-tags">
                        <span v-for="item in history" :key="item" class="history-tag" @click="onHistoryClick(item)">{{ item }}</span>
                    </div>
                    <div class="history-footer">
                        <span class="clear-history" @click="clearHistory">清空</span>
                    </div>
                </div>
            </div>
        </div>
    `
};