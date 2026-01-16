/**
 * 空间计算工具
 * 提供 SVG 元素空间关系计算的方法
 */
import { isRectIntersect, isRectContained, isRectTouch } from "./SnapUtils.js"

/**
 * 计算两个元素的边界框关系
 * @param {Object} element1 - 第一个 SVG 元素
 * @param {Object} element2 - 第二个 SVG 元素
 * @returns {Object}
 */
export const getElementsRelation = (element1, element2) => {
    const bbox1 = element1.bbox()
    const bbox2 = element2.bbox()

    return {
        intersect: isRectIntersect(bbox1, bbox2),
        contained: isRectContained(bbox1, bbox2) || isRectContained(bbox2, bbox1),
        touch: isRectTouch(bbox1, bbox2)
    }
}

/**
 * 计算元素的中心点
 * @param {Object} element - SVG 元素
 * @returns {Object} {x, y}
 */
export const getElementCenter = (element) => {
    const bbox = element.bbox()
    return {
        x: bbox.x + bbox.w / 2,
        y: bbox.y + bbox.h / 2
    }
}

/**
 * 计算元素相对于另一个元素的位置
 * @param {Object} element - 目标元素
 * @param {Object} referenceElement - 参考元素
 * @returns {Object}
 */
export const getElementPosition = (element, referenceElement) => {
    const elementBBox = element.bbox()
    const referenceBBox = referenceElement.bbox()

    return {
        left: elementBBox.x < referenceBBox.x,
        right: elementBBox.x > referenceBBox.x,
        top: elementBBox.y < referenceBBox.y,
        bottom: elementBBox.y > referenceBBox.y,
        centerX: elementBBox.x + elementBBox.w / 2,
        centerY: elementBBox.y + elementBBox.h / 2
    }
}

/**
 * 获取元素的所有关键点
 * @param {Object} element - SVG 元素
 * @returns {Object}
 */
export const getElementKeyPoints = (element) => {
    const bbox = element.bbox()
    return {
        topLeft: { x: bbox.x, y: bbox.y },
        topCenter: { x: bbox.x + bbox.w / 2, y: bbox.y },
        topRight: { x: bbox.x2, y: bbox.y },
        centerLeft: { x: bbox.x, y: bbox.y + bbox.h / 2 },
        center: { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 },
        centerRight: { x: bbox.x2, y: bbox.y + bbox.h / 2 },
        bottomLeft: { x: bbox.x, y: bbox.y2 },
        bottomCenter: { x: bbox.x + bbox.w / 2, y: bbox.y2 },
        bottomRight: { x: bbox.x2, y: bbox.y2 }
    }
}

/**
 * 计算点到元素边界框的最近点
 * @param {Object} element - SVG 元素
 * @param {number} px - 点的x坐标
 * @param {number} py - 点的y坐标
 * @returns {Object} {x, y}
 */
export const getNearestPointOnElement = (element, px, py) => {
    const bbox = element.bbox()
    return {
        x: clamp(px, bbox.x, bbox.x2),
        y: clamp(py, bbox.y, bbox.y2)
    }
}

/**
 * 计算一组元素的总边界框
 * @param {Array} elements - SVG 元素数组
 * @returns {Object}
 */
export const getElementsBoundingBox = (elements) => {
    if (!elements || elements.length === 0) {
        return null
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    elements.forEach((element) => {
        const bbox = element.bbox()
        minX = Math.min(minX, bbox.x)
        minY = Math.min(minY, bbox.y)
        maxX = Math.max(maxX, bbox.x2)
        maxY = Math.max(maxY, bbox.y2)
    })

    return {
        x: minX,
        y: minY,
        x2: maxX,
        y2: maxY,
        w: maxX - minX,
        h: maxY - minY
    }
}

/**
 * 判断点是否在元素内部
 * @param {Object} element - SVG 元素
 * @param {number} px - 点的x坐标
 * @param {number} py - 点的y坐标
 * @returns {boolean}
 */
export const isPointInElement = (element, px, py) => {
    const bbox = element.bbox()
    const point = element.node.createSVGPoint()
    point.x = px
    point.y = py

    try {
        const ctm = element.node.getScreenCTM()
        if (!ctm) return false

        const svgPoint = point.matrixTransform(ctm.inverse())
        return svgPoint.x >= bbox.x && svgPoint.x <= bbox.x2 && svgPoint.y >= bbox.y && svgPoint.y <= bbox.y2
    } catch (e) {
        return px >= bbox.x && px <= bbox.x2 && py >= bbox.y && py <= bbox.y2
    }
}

/**
 * 计算元素的宽高比
 * @param {Object} element - SVG 元素
 * @returns {number}
 */
export const getElementAspectRatio = (element) => {
    const bbox = element.bbox()
    if (bbox.h === 0) return Infinity
    return bbox.w / bbox.h
}

/**
 * 调整元素大小以保持宽高比
 * @param {Object} element - SVG 元素
 * @param {number} newWidth - 新的宽度
 * @returns {this}
 */
export const resizeWithAspectRatio = (element, newWidth) => {
    const bbox = element.bbox()
    const ratio = bbox.h / bbox.w
    const newHeight = newWidth * ratio

    const dx = (newWidth - bbox.w) / 2
    const dy = (newHeight - bbox.h) / 2

    element.width(newWidth).height(newHeight)
    element.move(bbox.x - dx, bbox.y - dy)

    return element
}

/**
 * 计算元素的对齐线
 * @param {Object} element - SVG 元素
 * @returns {Object}
 */
export const getAlignmentLines = (element) => {
    const bbox = element.bbox()
    return {
        vertical: [bbox.x, bbox.x + bbox.w / 2, bbox.x2],
        horizontal: [bbox.y, bbox.y + bbox.h / 2, bbox.y2]
    }
}

// 辅助函数
const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max)
}

export { isRectIntersect, isRectContained, isRectTouch }
