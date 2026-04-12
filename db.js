// ========== 数据库服务封装 ==========
const DB_NAME = 'ChubaoShoeDB', DB_VERSION = 73;
const STORES = {
    products: 'products',
    orders: 'orders',
    orderItems: 'orderItems',
    inventoryLogs: 'inventoryLogs',
    customers: 'customers'
};
let db = null;

export const dbService = {
    async open() {
        if (db) return db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => { db = request.result; resolve(db); };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORES.products)) {
                    const store = db.createObjectStore(STORES.products, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('shop_id', 'shop_id');
                    store.createIndex('create_time', 'create_time');
                }
                if (!db.objectStoreNames.contains(STORES.orders)) {
                    const store = db.createObjectStore(STORES.orders, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('status', 'status');
                }
                if (!db.objectStoreNames.contains(STORES.orderItems))
                    db.createObjectStore(STORES.orderItems, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORES.inventoryLogs))
                    db.createObjectStore(STORES.inventoryLogs, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORES.customers))
                    db.createObjectStore(STORES.customers, { keyPath: 'id', autoIncrement: true });

                const productStore = event.target.transaction.objectStore(STORES.products);
                productStore.count().onsuccess = (e) => {
                    if (e.target.result === 0) {
                        const defaultProducts = [
                            { shop_id: 1, sku: "XB-2301", name: "法式乐福鞋", tags: ["头层牛皮", "手工缝线"], sizeRange: "34-39", colors: [{ name: "黑色", sizeRange: "34-39", stockMap: {4:12,5:20,6:8,7:15,8:10,9:5} }, { name: "白色", sizeRange: "34-39", stockMap: {4:8,5:14,6:22,7:9,8:6,9:3} }], costPrice: 129, salePrices: { retail: 299, wholesale: 168, discount: 239 }, status:1, create_time:Date.now() - 86400000, update_time:Date.now(), submitter:"admin" },
                            { shop_id: 1, sku: "XB-2307", name: "复古切尔西靴", tags: ["加绒内里", "耐磨大底"], sizeRange: "35-40", colors: [{ name: "棕色", sizeRange: "35-40", stockMap: {5:8,6:15,7:12,8:20,9:6,0:4} }], costPrice: 189, salePrices: { retail: 399, wholesale: 228, discount: 329 }, status:1, create_time:Date.now() - 43200000, update_time:Date.now(), submitter:"admin" },
                            { shop_id: 1, sku: "XB-2518", name: "厚底松糕乐福鞋", tags: ["厚底显高", "软垫"], sizeRange: "22-26", colors: [{ name: "米色", sizeRange: "22-26", stockMap: {2:8,3:15,4:20,5:12,6:7} }], costPrice: 149, salePrices: { retail: 269, wholesale: 149, discount: 199 }, status:1, create_time:Date.now(), update_time:Date.now(), submitter:"admin" }
                        ];
                        defaultProducts.forEach(p => productStore.add(p));
                    }
                };
            };
        });
    },
    async getAllProducts() {
        await this.open();
        const tx = db.transaction(STORES.products, 'readonly');
        const store = tx.objectStore(STORES.products);
        const products = [];
        return new Promise((resolve) => {
            const index = store.index('create_time');
            index.openCursor(null, 'prev').onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) { products.push(cursor.value); cursor.continue(); }
                else resolve(products);
            };
        });
    },
    async addProduct(product) {
        await this.open();
        const tx = db.transaction(STORES.products, 'readwrite');
        const store = tx.objectStore(STORES.products);
        return new Promise((resolve) => {
            const request = store.add({ ...product, create_time: Date.now(), update_time: Date.now(), status: 1, shop_id: 1, submitter: 'admin' });
            request.onsuccess = (e) => resolve(e.target.result);
        });
    },
    async getCustomers() {
        await this.open();
        const tx = db.transaction(STORES.customers, 'readonly');
        const store = tx.objectStore(STORES.customers);
        const customers = [];
        return new Promise((resolve) => {
            store.openCursor().onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) { customers.push(cursor.value); cursor.continue(); }
                else resolve(customers);
            };
        });
    },
    async addCustomer(name, phone, address) {
        await this.open();
        const tx = db.transaction(STORES.customers, 'readwrite');
        const store = tx.objectStore(STORES.customers);
        return new Promise((resolve) => {
            const request = store.add({ name, phone, address, create_time: Date.now() });
            request.onsuccess = (e) => resolve(e.target.result);
        });
    },
    async getOrdersByStatus(status) {
        await this.open();
        const tx = db.transaction(STORES.orders, 'readonly');
        const store = tx.objectStore(STORES.orders);
        const index = store.index('status');
        const orders = [];
        return new Promise((resolve) => {
            index.openCursor(IDBKeyRange.only(status)).onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) { orders.push(cursor.value); cursor.continue(); }
                else resolve(orders);
            };
        });
    },
    async getOrderItems(orderId) {
        await this.open();
        const tx = db.transaction(STORES.orderItems, 'readonly');
        const store = tx.objectStore(STORES.orderItems);
        const items = [];
        return new Promise((resolve) => {
            store.openCursor().onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.order_id === orderId) items.push(cursor.value);
                    cursor.continue();
                } else resolve(items);
            };
        });
    },
    async updateOrderStatus(orderId, newStatus) {
        await this.open();
        const tx = db.transaction(STORES.orders, 'readwrite');
        const store = tx.objectStore(STORES.orders);
        return new Promise((resolve, reject) => {
            const getReq = store.get(orderId);
            getReq.onsuccess = (e) => {
                const order = e.target.result;
                if (!order) return resolve(false);
                order.status = newStatus;
                store.put(order).onsuccess = () => resolve(true);
            };
            getReq.onerror = reject;
        });
    },
    async deleteOrder(orderId) {
        await this.open();
        const tx = db.transaction([STORES.orders, STORES.orderItems], 'readwrite');
        const orderStore = tx.objectStore(STORES.orders);
        const itemStore = tx.objectStore(STORES.orderItems);
        const items = await new Promise(resolve => {
            const list = [];
            itemStore.openCursor().onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.order_id === orderId) list.push(cursor.value);
                    cursor.continue();
                } else resolve(list);
            };
        });
        for (let item of items) await new Promise(r => { itemStore.delete(item.id).onsuccess = r; });
        await new Promise(r => { orderStore.delete(orderId).onsuccess = r; });
        return true;
    },
    async updateProductStockAndCost(productId, itemsDelta, totalInQty, totalInCost, finalCostPrice = null) {
        await this.open();
        const tx = db.transaction(STORES.products, 'readwrite');
        const store = tx.objectStore(STORES.products);
        return new Promise((resolve, reject) => {
            const getReq = store.get(productId);
            getReq.onsuccess = (e) => {
                const product = e.target.result;
                for (let item of itemsDelta) {
                    const color = product.colors.find(c => c.name === item.colorName);
                    if (color) {
                        const newStock = (color.stockMap[item.size] || 0) + item.delta;
                        if (newStock < 0) return resolve(false);
                        color.stockMap[item.size] = newStock;
                    }
                }
                if (totalInQty > 0 && totalInCost > 0) {
                    if (finalCostPrice !== null) {
                        product.costPrice = parseFloat(finalCostPrice.toFixed(2));
                    } else {
                        const oldTotalQty = product.colors.reduce((s, c) => s + Object.values(c.stockMap).reduce((a, b) => a + b, 0), 0);
                        const oldTotalCost = oldTotalQty * (product.costPrice || 0);
                        const newTotalCost = oldTotalCost + totalInCost;
                        const newTotalQty = oldTotalQty + totalInQty;
                        product.costPrice = newTotalQty > 0 ? parseFloat((newTotalCost / newTotalQty).toFixed(2)) : 0;
                    }
                }
                product.update_time = Date.now();
                store.put(product).onsuccess = () => resolve(true);
            };
            getReq.onerror = reject;
        });
    },
    async addInventoryLog(shop_id, productId, sku, colorName, size, changeQuantity, unitCost, type, sourceId, sourceType, operator, remark) {
        await this.open();
        const tx = db.transaction(STORES.inventoryLogs, 'readwrite');
        const store = tx.objectStore(STORES.inventoryLogs);
        store.add({ shop_id, product_id: productId, sku, color_name: colorName, size, change_quantity: changeQuantity, unit_cost: unitCost, type, source_id: sourceId, source_type: sourceType, operator, remark, create_time: Date.now() });
        return new Promise(resolve => { tx.oncomplete = resolve; });
    },
    async saveOrder(orderNo, shopId, customerId, customerName, customerPhone, items, status) {
        await this.open();
        const tx = db.transaction([STORES.orders, STORES.orderItems], 'readwrite');
        const orderStore = tx.objectStore(STORES.orders);
        const itemStore = tx.objectStore(STORES.orderItems);
        const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
        const totalAmount = items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
        const order = { order_no: orderNo, shop_id: shopId, customer_id: customerId || null, customer_name: customerName || '', customer_phone: customerPhone || '', total_amount: totalAmount, total_quantity: totalQuantity, status, order_time: Date.now(), operator: 'admin' };
        return new Promise((resolve) => {
            const orderReq = orderStore.add(order);
            orderReq.onsuccess = (e) => {
                const orderId = e.target.result;
                for (let item of items) {
                    itemStore.add({ order_id: orderId, product_id: item.productId, sku: item.sku, product_name: item.productName, color_name: item.colorName, size: item.size, quantity: item.quantity, unit_price: item.unit_price, total_price: item.unit_price * item.quantity });
                }
                tx.oncomplete = () => resolve(orderId);
            };
        });
    }
};