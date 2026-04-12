export const AppSidebar = {
    props: ['sidebarOpen', 'pendingOrders', 'draftOrders'],
    emits: ['closeSidebar', 'openOrderSheet', 'showToast'],
    template: `
        <div>
            <div class="sidebar-overlay" :class="{ show: sidebarOpen }" @click="$emit('closeSidebar')"></div>
            <div class="sidebar" :class="{ open: sidebarOpen }">
                <div class="sidebar-inner">
                    <div class="sidebar-left">
                        <div class="shop-list-item">
                            <div class="shop-avatar"><svg viewBox="0 0 1024 1024"><path d="M815.40608 280.5248H206.48448L143.27808 445.9264c0 49.51552 41.088 90.5984 91.65312 90.5984s92.70784-40.03328 92.70784-90.5984c0 49.51552 41.088 90.5984 91.65312 90.5984S512 496.49152 512 445.9264c0 49.51552 41.088 90.5984 91.65312 90.5984s91.65312-40.03328 91.65312-90.5984c0 49.51552 41.088 90.5984 92.70784 90.5984 50.56512 0 92.70784-40.03328 92.70784-90.5984L815.40608 280.5248z m-50.57024 284.44672v210.69824H259.16416v-210.69824H206.4896v221.2352c0 18.96448 21.0688 42.1376 40.03328 42.1376h529.90464c18.96448 0 40.03328-23.17824 40.03328-42.1376v-221.2352h-51.62496z m50.57024-285.49632l2.10944 1.05472-2.10944-1.05472zM248.6272 238.3872h526.7456c17.90976 0 31.60576-13.696 31.60576-31.60576s-13.696-31.60576-31.60576-31.60576H248.6272c-17.90976 0-31.60576 13.696-31.60576 31.60576s13.696 31.60576 31.60576 31.60576z" fill="white"></path></svg></div>
                            <div class="shop-list-name">楚宝手工真皮女鞋</div>
                        </div>
                        <div class="add-shop-btn" @click="$emit('showToast', '添加新店铺功能开发中')">
                            <div class="add-shop-circle"><i class="fas fa-plus"></i></div>
                            <div class="add-shop-text">添加店铺</div>
                        </div>
                    </div>
                    <div class="sidebar-right">
                        <div class="current-shop-header">楚宝手工真皮女鞋</div>
                        <div class="sidebar-menu">
                            <div class="sidebar-item" @click="$emit('openOrderSheet', 'pending')"><i class="fas fa-credit-card"></i><span>待付款</span></div>
                            <div class="sidebar-item" @click="$emit('openOrderSheet', 'draft')"><i class="fas fa-clipboard-list"></i><span>工单</span></div>
                            <div class="sidebar-item" @click="$emit('showToast', '商品管理开发中')"><i class="fas fa-boxes"></i><span>商品管理</span></div>
                            <div class="sidebar-item" @click="$emit('showToast', '数据看板开发中')"><i class="fas fa-chart-line"></i><span>数据看板</span></div>
                            <div class="sidebar-item" @click="$emit('showToast', '设置功能开发中')"><i class="fas fa-cog"></i><span>设置</span></div>
                        </div>
                        <div class="sidebar-footer">© 龙虾手 v7</div>
                    </div>
                </div>
            </div>
        </div>
    `
};