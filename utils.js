// ========== 工具函数 ==========
export const utils = {
    // 解析尺码范围，返回真实尺码数组，例如 "34-39" -> [34,35,36,37,38,39]
    parseSizeRange(range) {
        if (!range) return [];
        let [s, e] = range.split('-').map(Number);
        if (isNaN(s) || isNaN(e)) return [];
        let sizes = [];
        for (let i = s; i <= e; i++) sizes.push(i);
        return sizes;
    },
    // 将真实尺码转换为显示用的个位数（用于前端展示）
    displaySize(size) {
        return size % 10;
    },
    // 获取颜色总库存
    getColorTotal(color) {
        return Object.values(color.stockMap).reduce((a, b) => a + b, 0);
    },
    // 获取指定尺码库存
    getStockForColor(color, size) {
        return color.stockMap[size] || 0;
    },
    // 获取商品总库存
    getProductTotalStock(product) {
        return product.colors.reduce((s, c) => s + this.getColorTotal(c), 0);
    },
    // 手机号脱敏
    maskPhone(phone) {
        if (!phone) return '';
        return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    },
    // 智能配箱算法
    calculatePackingSchemes(colorStock, groupSize) {
        const sizes = Object.keys(colorStock).map(Number).sort((a, b) => a - b);
        const total = sizes.reduce((sum, size) => sum + (colorStock[size] || 0), 0);
        if (total === 0) return [];
        const boxCount = Math.ceil(total / groupSize);
        const remaining = { ...colorStock };
        const boxes = [];
        const isSameAllocation = (a, b) => {
            for (let size of sizes) if ((a[size] || 0) !== (b[size] || 0)) return false;
            return true;
        };
        for (let i = 0; i < boxCount - 1; i++) {
            const remainingBoxes = boxCount - i;
            const allocations = sizes.map(size => {
                const maxPossible = Math.floor(remaining[size] / remainingBoxes);
                const alloc = Math.min(maxPossible, remaining[size]);
                return { size, alloc, available: remaining[size] - alloc };
            });
            let totalAllocated = allocations.reduce((sum, a) => sum + a.alloc, 0);
            let extraNeeded = groupSize - totalAllocated;
            if (extraNeeded > 0) {
                let hasAllocated;
                do {
                    hasAllocated = false;
                    const priorityQueue = allocations
                        .filter(a => a.available > 0)
                        .sort((a, b) => b.available - a.available);
                    for (const item of priorityQueue) {
                        if (extraNeeded <= 0) break;
                        item.alloc += 1;
                        item.available -= 1;
                        extraNeeded -= 1;
                        hasAllocated = true;
                    }
                } while (extraNeeded > 0 && hasAllocated);
            }
            const currentAllocation = {};
            for (const { size, alloc } of allocations) {
                currentAllocation[size] = alloc;
                remaining[size] -= alloc;
            }
            const existing = boxes.find(b => isSameAllocation(b.allocation, currentAllocation));
            if (existing) existing.count++;
            else boxes.push({ allocation: currentAllocation, count: 1 });
        }
        const lastAllocation = {};
        for (let size of sizes) lastAllocation[size] = remaining[size] || 0;
        const hasNonZero = Object.values(lastAllocation).some(v => v > 0);
        if (hasNonZero) {
            const existingLast = boxes.find(b => isSameAllocation(b.allocation, lastAllocation));
            if (existingLast) existingLast.count++;
            else boxes.push({ allocation: lastAllocation, count: 1 });
        }
        return boxes;
    }
};