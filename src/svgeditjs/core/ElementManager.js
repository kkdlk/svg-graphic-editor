import { Text } from "@svgdotjs/svg.js"
import EventConstant from "../constant/EventConstant.js"
/**
 * SVG 元素管理器
 * 用于管理 SVG 元素，提供元素的注册、查找、样式管理和生命周期管理
 */
export default class SVGElementManager {
    constructor(eventBus) {
        // 使用 Map 存储元素数据，key 为元素ID，value 为元素数据对象
        this._elements = new Map()
        // 事件总线
        this._eventBus = eventBus
    }

    /**
     * 注册 SVG 元素
     * @param {Object} svgElement - SVG.js 元素对象
     * @param {Object} metadata - 元素的元数据
     * @param {Object} styleProperties - 元素的样式属性
     * @returns {string|null} 返回元素的唯一ID，注册失败返回null
     */
    registerElement(svgElement, metadata = {}, styleProperties = {}) {
        // 参数校验
        if (!svgElement || !svgElement.node) {
            console.warn("SVG 元素无效: 元素或元素节点不存在")
            return null
        }
        // 生成唯一ID：使用传入的ID或生成基于时间戳的随机ID
        const elementId = metadata.id || this._generateUniqueId(svgElement.node.nodeName.toLowerCase())
        // 设置元素属性
        svgElement.attr({
            ...metadata,
            "data-svg-id": elementId
        })
        // 设置元素DOM ID
        svgElement.id(elementId)
        // 创建元素数据对象
        const elementData = {
            element: svgElement,
            id: elementId,
            type: svgElement.node.nodeName.toLowerCase(),
            metadata: this._extractMetadata(svgElement, metadata),
            style: this._extractAndMergeStyle(svgElement, styleProperties)
        }
        // 存储到Map
        this._elements.set(elementId, elementData)
        // console.log(`元素注册成功: ID=${elementId}, 类型=${elementData.type}`)
        return elementId
    }

    /**
     * 获取元素对象
     * @param {string} elementId - 元素ID
     * @returns {Object|null} SVG元素对象，不存在返回null
     */
    getElementById(elementId) {
        const elementData = this._elements.get(elementId)
        return elementData ? elementData.element : null
    }

    /**
     * 获取元素的完整数据
     * @param {string} elementId - 元素ID
     * @returns {Object|null} 元素数据对象，包含元素、元数据和样式
     */
    getElementData(elementId) {
        return this._elements.get(elementId) || null
    }

    /**
     * 获取元素的样式
     * @param {string} elementId - 元素ID
     * @returns {Object|null} 元素样式对象
     */
    getElementStyle(elementId) {
        const elementData = this._elements.get(elementId)
        return elementData ? { ...elementData.style } : null
    }

    /**
     * 通过 SVG 元素对象获取其ID
     * @param {Object} svgElement - SVG.js 元素对象
     * @returns {string|null} 元素ID，未找到返回null
     */
    getElementId(svgElement) {
        if (!svgElement || !svgElement.node) {
            return null
        }
        // 尝试从元素属性获取ID
        const idFromAttr = svgElement.attr("data-svg-id") || svgElement.id()
        if (idFromAttr && this._elements.has(idFromAttr)) {
            return idFromAttr
        }
        // 遍历查找
        for (const [id, data] of this._elements) {
            if (data.element === svgElement) {
                return id
            }
        }
        return null
    }
    /**
     * 检查元素是否存在
     * @param {string} elementId - 元素ID
     * @returns {boolean} 是否存在
     */
    hasElement(elementId) {
        return this._elements.has(elementId)
    }
    /**
     * 获取元素数量
     * @returns {number} 管理的元素总数
     */
    getElementCount() {
        return this._elements.size
    }

    /**
     * 获取所有元素对象
     * @param {Function} filterCallback - 过滤回调
     * @returns {Array} SVG元素对象数组
     */
    getAllElements(filterCallback = void 0) {
        const elements = []
        for (const [id, data] of this._elements) {
            if (!data.element || !data.element.node) continue
            // 自定义过滤
            if (filterCallback && !filterCallback(data.element, data)) continue
            elements.push(data.element)
        }
        return elements
    }

    /**
     * 获取所有元素数据
     * @param {Object} options - 过滤选项
     * @returns {Array} 元素数据数组
     */
    getAllElementData(filterCallback = void 0) {
        const elementDataList = []
        for (const [id, data] of this._elements) {
            if (!data.element || !data.element.node) continue
            // 自定义过滤
            if (filterCallback && !filterCallback(data.element, data)) continue
            elementDataList.push(data)
        }
        return elementDataList
    }

    /**
     * 清空所有元素
     * @param {boolean} removeFromDOM - 是否从DOM中移除
     * @returns {number} 被清除的元素数量
     */
    clearAllElements(removeFromDOM = true) {
        const removedCount = this._elements.size
        if (removeFromDOM) {
            this._elements.forEach((data) => {
                if (data.element && data.element.remove) {
                    data.element.remove()
                }
            })
        }
        this._elements.clear()
        return removedCount
    }

    /**
     * 删除元素
     * @param {string} elementId - 要删除的元素ID
     * @param {boolean} removeFromDom - 是否删除引用时，同时删除DOM
     * @returns {Object|null} 删除的元素数据，未找到返回null
     */
    removeElement(elementId, removeFromDOM = true) {
        const elementData = this._elements.get(elementId)
        if (!elementData) {
            console.warn(`删除失败: 未找到ID为 ${elementId} 的元素`)
            return null
        }
        try {
            // 从DOM中移除
            if (removeFromDOM && elementData.element && elementData.element.remove) {
                elementData.element.remove()
            }
            // 从管理器中移除
            this._elements.delete(elementId)
            // console.log(`元素删除成功: ID=${elementId}, 从DOM移除=${removeFromDOM}`)
            return elementData
        } catch (error) {
            console.error(`删除失败: ID=${elementId}`, error)
            return null
        }
    }

    /**
     * 导出元素数据
     * @param {Array} elementIds - 要导出的元素ID数组（不传则导出所有）
     * @returns {Object} 导出的元素数据
     */
    exportElementData(elementIds = null) {
        const ids = elementIds || Array.from(this._elements.keys())
        const exportData = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            elementCount: ids.length,
            elements: []
        }

        ids.forEach((id) => {
            const elementData = this._elements.get(id)
            if (elementData) {
                exportData.elements.push({
                    id: elementData.id,
                    type: elementData.type,
                    metadata: { ...elementData.metadata },
                    style: { ...elementData.style }
                })
            }
        })

        return exportData
    }
    /**
     * 销毁管理器
     * @param {Object} options - 销毁选项
     * @param {boolean} options.removeElements - 是否移除所有元素
     */
    destroy() {
        this.clearAllElements(true)
    }

    /**
     * TODO: 唯一ID 生成唯一ID
     * @param {string} elementType - 元素类型
     * @returns {string} 唯一ID
     * @private
     */
    _generateUniqueId(elementType = "element") {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substr(2, 9)
        return `${elementType}_${timestamp}_${random}`
    }
    /**
     * 递归添加元素
     * @param {Object} svgElement - SVG元素
     * @private
     */
    addElementsRecursively(svgElement) {
        if (!svgElement || !svgElement.node) return
        // 递归处理子元素
        svgElement.children().forEach((child) => {
            this.addElementsRecursively(child)
        })
        if (svgElement.type !== "svg") {
            // 添加当前元素
            this.registerElement(svgElement)
        }
    }

    /**
     * 提取并合并样式
     * @param {Object} svgElement - SVG元素
     * @param {Object} styleOverrides - 要覆盖的样式
     * @returns {Object} 合并后的样式对象
     * @private
     */
    _extractAndMergeStyle(svgElement, styleOverrides = {}) {
        // 从元素提取的样式
        const extractedStyle = {
            fill: svgElement.attr("fill") || "transparent",
            stroke: svgElement.attr("stroke") || "transparent",
            "stroke-width": svgElement.attr("stroke-width") || 1,
            "stroke-dasharray": svgElement.attr("stroke-dasharray") || "none",
            "stroke-linecap": svgElement.attr("stroke-linecap") || "butt",
            "stroke-linejoin": svgElement.attr("stroke-linejoin") || "miter",
            opacity: svgElement.opacity() || 1,
            "font-size": svgElement.attr("font-size") || 16,
            "font-family": svgElement.attr("font-family") || "Microsoft YaHei",
            "text-anchor": svgElement.attr("text-anchor") || "start",
            "dominant-baseline": svgElement.attr("dominant-baseline") || "middle",
            "font-weight": svgElement.attr("font-weight") || "normal",
            "font-style": svgElement.attr("font-style") || "normal",
            text: svgElement instanceof Text ? svgElement.text?.() : ""
        }
        // 合并样式
        return {
            ...styleOverrides,
            ...extractedStyle
        }
    }
    /**
     * 提取元素元数据
     * @param {Object} svgElement - SVG元素
     * @param {Object} metadataOverrides - 要覆盖的元数据
     * @returns {Object} 提取后的元数据对象
     * @private
     */
    _extractMetadata(svgElement, metadataOverrides = {}) {
        // 从元素提取的元数据
        const extractedMetadata = {
            x: svgElement.x(),
            y: svgElement.y(),
            width: svgElement.width(),
            height: svgElement.height(),
            rotate: svgElement.transform().rotate || 0
        }
        // 合并元数据
        return {
            ...metadataOverrides,
            ...extractedMetadata
        }
    }
    /**
     * 格式化元素数据
     * @param {Array} elementIds - 要格式化的元素ID数组
     * @returns {Object} 格式化后的元素数据
     */
    elementFormatData(elementIds) {
        elementIds.forEach((id) => {
            const elementData = this._elements.get(id)
            if (elementData) {
                elementData.metadata = this._extractMetadata(elementData.element, elementData.metadata)
                elementData.style = this._extractAndMergeStyle(elementData.element, elementData.style)
            }
        })
        this._eventBus.emit(EventConstant.ELEMENT_FORMAT_DATA, elementIds)
    }

    /**
     * 更新元素数据
     * @param {string} elementId - 要更新的元素ID
     * @param {Object} updateData - 包含要更新的元数据和样式的对象
     */
    updateElementData(elementId, updateData) {
        const elementData = this._elements.get(elementId)
        if (!elementData) {
            return
        }
        if (updateData.metadata) {
            if (updateData.metadata.width) {
                elementData.element.width(updateData.metadata.width)
            }
            if (updateData.metadata.height) {
                elementData.element.height(updateData.metadata.height)
            }
            if (updateData.metadata.rotate) {
                elementData.element.transform({ rotate: updateData.metadata.rotate })
            }
            if (updateData.metadata.x) {
                elementData.element.x(updateData.metadata.x)
            }
            if (updateData.metadata.y) {
                elementData.element.y(updateData.metadata.y)
            }
            const tempMetadata = Object.assign({}, elementData.metadata, updateData.metadata)
            const metadata = this._extractMetadata(elementData.element, tempMetadata)
            elementData.metadata = metadata
        }
        if (updateData.style) {
            // 先修改dom的实际样式，再更新数据
            if (updateData.style.fillType) {
                if (updateData.style.fillType === "none") {
                    updateData.style.fill = "transparent"
                }
                elementData.element.attr("fillType", updateData.style.fillType)
            }
            if (updateData.style.text) {
                elementData.element.plain(updateData.style.text)
            }
            elementData.element.attr(updateData.style)
            elementData.style = this._extractAndMergeStyle(elementData.element, updateData.style)
        }
        this._eventBus.emit(EventConstant.ELEMENT_UPDATE_DATA, elementId)
    }
}
