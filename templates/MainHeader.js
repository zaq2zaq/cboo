export default `
<div class="container-1" :class="{ 'search-active': searchActive }">
    <AppHeader shop-name="楚宝手工真皮女鞋" @toggle-sidebar="sidebarOpen = true" @search="toggleSearch" @scan="showToast('📷 扫码')" @add="openAddProduct" />
    <div class="kpi-flat-row">
        <div class="flat-kpi-item"><div class="flat-title">总库存</div><div class="flat-number">{{ totalStockAll }}</div><div class="flat-sub">23单 今日</div></div>
        <div class="flat-kpi-item"><div class="flat-title">货品数</div><div class="flat-number">{{ productList.length }}</div><div class="flat-sub">0 今日新增</div></div>
        <div class="flat-kpi-item"><div class="flat-title">现季比</div><div class="flat-number">50%</div><div class="flat-sub">有库存占比68%</div></div>
    </div>
    <div class="expanded-block" :class="{ show: isExpanded }">
        <div class="metrics-row"><div class="metric-item"><div class="metric-title">动销率</div><div class="metric-value">78%</div><div class="metric-trend">↑5%</div></div><div class="metric-item"><div class="metric-title">缺货预警</div><div class="metric-value">2</div><div class="metric-trend">需补货</div></div><div class="metric-item"><div class="metric-title">周转天数</div><div class="metric-value">32天</div><div class="metric-trend">同比-3天</div></div></div>
    </div>
    <div class="copyright-in-container1">© 龙虾手 v7</div>
</div>
`;