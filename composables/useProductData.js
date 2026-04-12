import { ref, computed } from 'vue';
import { utils } from '../utils.js';
import { dbService } from '../db.js';

export function useProductData() {
    const productList = ref([]);
    const searchKeyword = ref('');
    const filterType = ref('全部');
    const sortType = ref('default');
    
    const filteredProducts = computed(() => {
        let list = productList.value;
        if (searchKeyword.value) {
            const kw = searchKeyword.value.toLowerCase();
            list = list.filter(p => p.sku.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw));
        }
        if (filterType.value === '有库存') list = list.filter(p => utils.getProductTotalStock(p) > 0);
        if (filterType.value === '热销') list = list.filter(p => utils.getProductTotalStock(p) > 20);
        if (sortType.value === 'sales') list = [...list].sort((a,b) => utils.getProductTotalStock(b) - utils.getProductTotalStock(a));
        else if (sortType.value === 'price') list = [...list].sort((a,b) => (a.costPrice||0) - (b.costPrice||0));
        else if (sortType.value === 'oldest') list = [...list].sort((a,b) => (a.create_time||0) - (b.create_time||0));
        else list = [...list].sort((a,b) => (b.create_time||0) - (a.create_time||0));
        return list;
    });
    
    const filteredCount = computed(() => filteredProducts.value.length);
    const totalStockAll = computed(() => productList.value.reduce((sum,p)=>sum + utils.getProductTotalStock(p),0));
    
    async function loadProducts() {
        await dbService.open();
        productList.value = await dbService.getAllProducts();
    }
    
    function onFilterChange(val) { filterType.value = val; }
    function onSortChange(val) {
        if (val === '综合') sortType.value = 'default';
        else if (val === '销量') sortType.value = 'sales';
        else if (val === '价格') sortType.value = 'price';
        else if (val === '最早') sortType.value = 'oldest';
    }
    function onSearch(val) { searchKeyword.value = val; }
    function resetSearch() { searchKeyword.value = ''; filterType.value = '全部'; sortType.value = 'default'; }
    
    return {
        productList,
        searchKeyword,
        filterType,
        sortType,
        filteredProducts,
        filteredCount,
        totalStockAll,
        loadProducts,
        onFilterChange,
        onSortChange,
        onSearch,
        resetSearch,
    };
}
