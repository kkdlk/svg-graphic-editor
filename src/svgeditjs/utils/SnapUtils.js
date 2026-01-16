/**
 * 拖拽时应用边界约束
 * @private
 */
export const applyBoundaryConstraints = (x, y, box, constraints) => {
    // In case your dragged element is a nested element,
    // you are better off using the rbox() instead of bbox()
    let constrainedX = x
    let constrainedY = y
    // 左边界约束
    if (x < constraints.x) {
        constrainedX = constraints.x
    }
    // 上边界约束
    if (y < constraints.y) {
        constrainedY = constraints.y
    }
    // 右边界约束
    if (box.x2 > constraints.x2) {
        constrainedX = constraints.x2 - box.w
    }
    // 下边界约束
    if (box.y2 > constraints.y2) {
        constrainedY = constraints.y2 - box.h
    }
    return [constrainedX, constrainedY]
}
/**
 * 应用网格吸附
 * @private
 */
export const applyGridSnap = (x, y, box, constraints, gridSize) => {
    /**
     * 调整吸附位置，确保不超出边界
     * @private
     */
    const adjustSnapPosition = (snapPos, size, minBound, maxBound) => {
        // 检查左边界
        if (snapPos < minBound) {
            return minBound
        }
        // 检查右边界
        if (snapPos + size > maxBound) {
            // 计算最大可能的吸附位置
            const maxSnap = Math.floor((maxBound - size) / gridSize) * gridSize
            // 确保不小于最小边界
            return Math.max(minBound, maxSnap)
        }
        return snapPos
    }
    // 计算吸附位置
    let snapX = Math.round(x / gridSize) * gridSize
    let snapY = Math.round(y / gridSize) * gridSize

    // 检查并调整吸附位置
    snapX = adjustSnapPosition(snapX, box.w, constraints.x, constraints.x2)
    snapY = adjustSnapPosition(snapY, box.h, constraints.y, constraints.y2)

    return [snapX, snapY]
}

/**
 * 判断矩形是否相交
 * @param {Object} rect1 - 第一个矩形
 * @param {Object} rect2 - 第二个矩形
 * @returns {boolean}
 */
export const isRectIntersect = (rect1, rect2) => {
    return !(rect1.x2 < rect2.x || rect1.x > rect2.x2 || rect1.y2 < rect2.y || rect1.y > rect2.y2)
}

/**
 * 判断矩形是否被完全包含
 * @param {Object} innerRect - 被包含的矩形
 * @param {Object} outerRect - 外部矩形
 * @returns {boolean}
 */
export const isRectContained = (innerRect, outerRect) => {
    return innerRect.x >= outerRect.x && innerRect.y >= outerRect.y && innerRect.x2 <= outerRect.x2 && innerRect.y2 <= outerRect.y2
}

/**
 * 判断矩形是否接触（边界有接触）
 * @param {Object} rect1 - 第一个矩形
 * @param {Object} rect2 - 第二个矩形
 * @param {number} tolerance - 容差范围
 * @returns {boolean}
 */
export const isRectTouch = (rect1, rect2, tolerance = 1) => {
    const expandedRect2 = {
        x: rect2.x - tolerance,
        y: rect2.y - tolerance,
        x2: rect2.x2 + tolerance,
        y2: rect2.y2 + tolerance
    }
    return isRectIntersect(rect1, expandedRect2)
}

/**
 * 将鼠标事件坐标转换为 SVG 坐标系统中的坐标
 * @param {Event} e - 鼠标事件
 * @param {SVGElement} svgElement - SVG元素
 * @returns {Object} {x, y}
 */
export const convertMouseToSvgCoordinates = (e, svgElement) => {
    const point = svgElement.createSVGPoint()
    point.x = e.clientX
    point.y = e.clientY
    const screenCTM = svgElement.getScreenCTM()
    if (screenCTM) {
        const transformedPoint = point.matrixTransform(screenCTM.inverse())
        return { x: transformedPoint.x, y: transformedPoint.y }
    }
    return { x: e.offsetX, y: e.offsetY }
}

/**
 * 计算两点之间的距离
 * @param {number} x1 - 第一个点的x坐标
 * @param {number} y1 - 第一个点的y坐标
 * @param {number} x2 - 第二个点的x坐标
 * @param {number} y2 - 第二个点的y坐标
 * @returns {number}
 */
export const distanceBetweenPoints = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

/**
 * 计算点到直线的垂直距离
 * @param {number} px - 点的x坐标
 * @param {number} py - 点的y坐标
 * @param {number} x1 - 直线起点的x坐标
 * @param {number} y1 - 直线起点的y坐标
 * @param {number} x2 - 直线终点的x坐标
 * @param {number} y2 - 直线终点的y坐标
 * @returns {number}
 */
export const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) {
        param = dot / lenSq
    }

    let xx, yy

    if (param < 0) {
        xx = x1
        yy = y1
    } else if (param > 1) {
        xx = x2
        yy = y2
    } else {
        xx = x1 + param * C
        yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy

    return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 角度转弧度
 * @param {number} degrees - 角度
 * @returns {number}
 */
export const degreesToRadians = (degrees) => {
    return degrees * (Math.PI / 180)
}

/**
 * 弧度转角度
 * @param {number} radians - 弧度
 * @returns {number}
 */
export const radiansToDegrees = (radians) => {
    return radians * (180 / Math.PI)
}

/**
 * 限制数值在范围内
 * @param {number} value - 数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number}
 */
export const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max)
}

/**
 * 线性插值
 * @param {number} start - 起始值
 * @param {number} end - 结束值
 * @param {number} t - 插值因子 (0-1)
 * @returns {number}
 */
export const lerp = (start, end, t) => {
    return start + (end - start) * t
}

/**
 * 生成唯一ID
 * @param {string} prefix - 前缀
 * @returns {string}
 */
export const generateId = (prefix = "el") => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 深度克隆对象
 * @param {Object} obj - 要克隆的对象
 * @returns {Object}
 */
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== "object") {
        return obj
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime())
    }

    if (obj instanceof Array) {
        return obj.map((item) => deepClone(item))
    }

    if (obj instanceof Object) {
        const clonedObj = {}
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key])
            }
        }
        return clonedObj
    }

    return obj
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间
 * @returns {Function}
 */
export const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制
 * @returns {Function}
 */
export const throttle = (func, limit) => {
    let inThrottle
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}
