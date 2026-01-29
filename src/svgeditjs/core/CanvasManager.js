// 导入 SVG.js 扩展
import { SVG, extend as SvgExtend, Element } from "@svgdotjs/svg.js"
import "@svgdotjs/svg.select.js/src/svg.select.css"
import "@svgdotjs/svg.panzoom.js"
import "@svgdotjs/svg.resize.js"
import "@svgdotjs/svg.select.js"
import "@svgdotjs/svg.draggable.js"
import { SVG_METADATA, SVG_META_BUILT_ID } from "../constant/BasicConfig.js"
import ElementManager from "./ElementManager.js"
import SvgElementExtend from "../extend/SvgElementExtend.js"
import SVGCoreContext from "./SvgCoreContext.js"

/**
 * 画布管理器 (CanvasManager)
 */
export default class CanvasManager {
    /**
     * 创建画布管理器实例
     * @param {string} containerId - HTML 容器元素的 ID,用于容纳 SVG 画布
     * @param {SVGCoreContext} svgCoreContext - SVG 编辑器实例
     * @returns {CanvasManager} 画布管理器实例
     */
    constructor(containerId, svgCoreContext) {
        /** @type {string} 容器元素 ID */
        this._containerId = containerId
        /** @type {SVGCoreContext} SVG 核心上下文实例 */
        this._svgCoreContext = svgCoreContext
        // 注册元素新扩展
        SvgExtend(Element, {
            _editorState: svgCoreContext.editorState,
            ...SvgElementExtend
        })
        // SVG.js 画布实例
        this._svgCanvas = this._createSVGContainer()
        // 禁用右键菜单
        this._svgCanvas.node.addEventListener("contextmenu", (e) => {
            e.preventDefault()
        })
        /** @type {ElementManager} 元素管理器 */
        this._elementManager = new ElementManager(svgCoreContext.eventBus)
        // 容器尺寸变化监听器
        this._resizeObserver = null
        // 创建画布容器背景和网格
        this._createCanvasContainerBackgroundAndGrid()
        // 图案填充
        this._fillPatternMap = new Map()
    }
    /**
     * 初始化 SVG 容器
     */
    _createSVGContainer() {
        // 清空容器内容
        const container = document.getElementById(this._containerId)
        container && (container.innerHTML = "")
        const svgWidth = this._svgCoreContext.editorState.getState("svgWidth")
        const svgHeight = this._svgCoreContext.editorState.getState("svgHeight")
        // 处理百分比尺寸
        const width = svgWidth === "100%" ? container.clientWidth : svgWidth
        const height = svgHeight === "100%" ? container.clientHeight : svgHeight
        // 创建 SVG 画布
        const svgCanvas = SVG().addTo(`#${this._containerId}`).size(width, height).viewbox(0, 0, width, height)
        return svgCanvas
    }

    _createCanvasContainerBackgroundAndGrid() {
        const container = document.getElementById(this._containerId)
        this._updateCanvasSizeAndGrid(container) // 1. 初始化创建
        this._setupResizeObserver(container) // 2. 设置容器大小监听
        this._subscribeStateChanges(container) // 3. 订阅状态变化
    }

    // 统一更新画布尺寸和网格
    _updateCanvasSizeAndGrid(container) {
        const state = this._svgCoreContext.editorState
        const svgWidth = state.getState("svgWidth")
        const svgHeight = state.getState("svgHeight")
        const svgBgColor = state.getState("svgBgColor") || "transparent"
        const showGrid = state.getState("showGrid")
        const gridSize = state.getState("gridSize")
        const gridLineColor = state.getState("gridLineColor") || "transparent"

        const width = svgWidth === "100%" ? container.clientWidth : svgWidth
        const height = svgHeight === "100%" ? container.clientHeight : svgHeight
        this._svgCanvas.size(width, height).viewbox(0, 0, width, height)
        this._initContainerAndGrid(width, height, svgBgColor, showGrid, gridSize, gridLineColor)
    }

    // 只负责设置 ResizeObserver
    _setupResizeObserver(container) {
        const svgWidth = this._svgCoreContext.editorState.getState("svgWidth")
        const svgHeight = this._svgCoreContext.editorState.getState("svgHeight")

        if (svgWidth === "100%" || svgHeight === "100%") {
            this._resizeObserver?.disconnect()
            this._resizeObserver = new ResizeObserver(() => {
                // console.log("容器大小变化", container.clientWidth, container.clientHeight)
                this._updateCanvasSizeAndGrid(container) // 复用更新逻辑
            })
            this._resizeObserver.observe(container)
        } else {
            this._resizeObserver?.disconnect()
            this._resizeObserver = null
        }
    }

    // 只负责订阅状态变化
    _subscribeStateChanges(container) {
        this._svgCoreContext.editorState.subscribe(["svgWidth", "svgHeight", "svgBgColor", "showGrid", "gridSize", "gridLineColor"], () =>
            this._updateCanvasSizeAndGrid(container)
        )
    }

    /**
     * 初始化容器背景和网格
     * @private
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {string} bgColor - 背景颜色
     * @param {boolean} showGrid - 是否显示网格
     * @param {number} gridSize - 网格大小
     * @param {string} gridLineColor - 网格线颜色
     */
    _initContainerAndGrid(width, height, bgColor = "transparent", showGrid = true, gridSize = 50, gridLineColor = "#f87f7f") {
        // 处理背景
        const hasBackground = this._elementManager.hasElement(SVG_META_BUILT_ID.backgroundId)
        if (hasBackground) {
            // 更新现有背景
            const backgroundRect = this._elementManager.getElementById(SVG_META_BUILT_ID.backgroundId)
            backgroundRect.size(width, height).fill(bgColor).stroke({ width: 1, color: "#ddd" })
        } else {
            // 创建并注册新背景
            const newBackgroundRect = this._svgCanvas.rect(width, height).fill(bgColor).stroke({ width: 1, color: "#ddd" })
            this._elementManager.registerElement(newBackgroundRect, {
                id: SVG_META_BUILT_ID.backgroundId,
                [SVG_METADATA.noSelect]: true
            })
        }
        // 处理网格显示
        const hasGrid = this._elementManager.hasElement(SVG_META_BUILT_ID.gridId)
        if (showGrid) {
            if (hasGrid) {
                // 更新现有网格
                const gridGroup = this._elementManager.getElementById(SVG_META_BUILT_ID.gridId)
                gridGroup.clear()
                this._drawGrid(gridSize, gridLineColor, gridGroup)
            } else {
                // 创建并注册新网格
                const gridGroup = this._drawGrid(gridSize, gridLineColor)
                this._elementManager.registerElement(gridGroup, {
                    id: SVG_META_BUILT_ID.gridId,
                    [SVG_METADATA.noSelect]: true
                })
            }
        } else if (hasGrid) {
            // 隐藏网格
            const gridGroup = this._elementManager.getElementById(SVG_META_BUILT_ID.gridId)
            gridGroup.clear()
        }
    }

    /**
     * 绘制网格
     * @private
     * @returns {Group} 网格组元素
     */
    _drawGrid(gridSize = 50, gridLineColor = "#f87f7f", group = null) {
        // 获取画布尺寸
        const width = typeof this._svgCanvas.width() === "string" ? this._svgCanvas.node.clientWidth : this._svgCanvas.width()
        const height = typeof this._svgCanvas.height() === "string" ? this._svgCanvas.node.clientHeight : this._svgCanvas.height()
        // 创建网格组
        const gridGroup = group || this._svgCanvas.group().addClass("background-grid-layer")
        // 绘制垂直网格线
        for (let x = 0; x <= width; x += gridSize) {
            gridGroup
                .line(x, 0, x, height)
                .stroke({
                    width: 0.5,
                    color: gridLineColor,
                    opacity: 0.5
                })
                .attr(SVG_METADATA.noSelect, true)
        }
        // 绘制水平网格线
        for (let y = 0; y <= height; y += gridSize) {
            gridGroup
                .line(0, y, width, y)
                .stroke({
                    width: 0.5,
                    color: gridLineColor,
                    opacity: 0.5
                })
                .attr(SVG_METADATA.noSelect, true)
        }
        return gridGroup
    }

    /**
     * 注册填充
     * @param {string} name - 填充名称
     * @param {string} svgString - 填充 SVG 字符串
     */
    registerFillPattern(name, svgString) {
        const defs = this._svgCanvas.defs()
        this._elementManager.registerElement(defs)
        const width = 64
        const height = 64
        const pattern = defs
            .pattern(width, height, (svgEl) => {
                svgEl.svg(svgString).viewbox(0, 0, width, height).size("100%", "100%").move(0, 0)
            })
            .attr({
                patternUnits: "userSpaceOnUse"
            })
        // 添加到容器内
        const eleId = this._elementManager.registerElement(pattern)
        // 注册到ID和内容的映射
        this._fillPatternMap.set(eleId, { id: eleId, label: name, value: `url(#${eleId})`, pattern: pattern })
        return eleId
    }
    /**
     * 是否是不可选择元素
     * @param {string} elementId - 元素 ID
     * @returns {boolean} 是否应该跳过
     */
    isElementSkipped(elementId) {
        const elementData = this._elementManager.getElementData(elementId)
        if (elementData && elementData?.metadata?.[SVG_METADATA.noSelect]) {
            return true
        }
        return false
    }
    /**
     * 销毁画布管理器
     * 清理所有资源和事件绑定
     */
    destroy() {
        // 断开容器尺寸变化监听器
        this._fillPatternMap.clear()
        this._resizeObserver?.disconnect()
        this._resizeObserver = null
        this._elementManager.destroy()
        this._svgCanvas.clear()
        this._svgCanvas = null
    }

    /**
     * 获取元素管理器
     * @returns {ElementManager}
     */
    get elementManager() {
        return this._elementManager
    }
    /**
     * 获取 SVG 画布实例
     * @returns {SVG}
     */
    get svgCanvas() {
        return this._svgCanvas
    }
    get fillPatternMap() {
        return this._fillPatternMap
    }
    clearFillPattern() {
        this._fillPatternMap.clear()
    }
}
