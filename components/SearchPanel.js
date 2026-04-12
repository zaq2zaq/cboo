import { ref, computed, watch, nextTick, inject } from 'vue';

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