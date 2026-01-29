import EditorState from "./EditorState.js"
import EventBus from "../event/EventBus.js"
import CanvasManager from "./CanvasManager.js"
import SelectionHandler from "./SelectionHandler.js"
import DrawingManager from "./DrawingManager.js"
import EventConstant from "../constant/EventConstant.js"
import { SVG } from "@svgdotjs/svg.js"
import SvgToDxfConverter from "../utils/SvgToDxfConverter.js"
import HistoryManager from "./HistoryManager.js"

/**
 * @class SVGCoreContext
 * SVG 核心上下文类
 * 负责管理 SVG 编辑器的核心组件和状态
 */
export default class SVGCoreContext {
    constructor(containerId, state = {}) {
        this._containerId = containerId
        // 1、构建一个状态管理器
        this._editorState = new EditorState()
        // 2、构建事件管理器
        this._eventBus = new EventBus()
        // 3、构建画板管理器
        this._canvasManager = new CanvasManager(containerId, this)
        // 4、提取svg画布实例
        this._svgCanvas = this._canvasManager.svgCanvas
        // 5、提取元素管理器实例
        this._elementManager = this._canvasManager.elementManager
        // 6、构建平移缩放实例 其实还是svgCanvas，为了语义区分
        this._panZoom = this._svgCanvas.panZoom(false)
        // 7、构建元素选择管理器
        this._selectionHandler = new SelectionHandler(this)
        // 8、构建绘图管理器
        this._drawingManager = new DrawingManager(this)
        // 9、订阅当前工具变化事件
        this._subscribeCurrentTool()
        // 10、重置默认值触发事件
        this._editorState.resetState(state)
        this.createTemplateSvg()
        // 11、构建历史记录管理器 (放在最后以捕获初始状态)
        this._historyManager = new HistoryManager(this)
    }

    /**
     * 创建模板数据
     */
    createTemplateSvg() {
        // 绘制红色矩形
        const rect = this._svgCanvas.rect(100, 100).move(100, 100).fill("#f00")
        this._elementManager.registerElement(rect)
        // 绘制蓝色矩形
        const rect1 = this._svgCanvas.rect(200, 100).move(300, 300).fill("rgba(11, 18, 228, 0.98)")
        this._elementManager.registerElement(rect1)
        // 绘制折线
        const polyline = this._svgCanvas.polyline([
            [100, 100],
            [200, 100],
            [200, 200]
        ])
        this._elementManager.registerElement(polyline)
        const path1 = this._svgCanvas
            .path(
                "M 749.2000122070312 389 C 1036.199951171875 306, 557.2000732421875 356, 844.2000122070312 273 C 900.2000122070312 122, 929.2000122070312 355, 985.2000122070312 204 C 985.2000122070312 204, 757.2000122070312 128, 757.2000122070312 128 C 689.2000122070312 232, 757.2000122070312 128, 689.2000122070312 232"
            )
            .fill("transparent")
            .stroke("#999999")
        this._elementManager.registerElement(path1)
    }

    /**
     * 设置平移缩放状态
     * @param {boolean} state 是否启用平移缩放
     */
    setPanZoomStatus(state) {
        if (state) {
            const panZoomOptions = this._editorState.getState("panZoomOptions")
            this._panZoom.panZoom(panZoomOptions)
        } else {
            this._panZoom.panZoom(false)
        }
        // 更新状态
        this._editorState.setState("panZoomStatus", state)
    }

    /**
     * 设置当前工具
     * @param {string} toolType - 工具类型 (moveZoom/select/rect/circle/ellipse/line/polygon/polyline/bezier/text)
     */
    setTool(toolType) {
        this._editorState.setState("currentTool", toolType)
    }
    /**
     * 清空画布
     */
    clear() {
        this._elementManager.clearAllElements(true)
    }
    /**
     * 注册填充
     * @param {string} name - 填充名称
     * @param {string} svgString - 填充 SVG 字符串
     * @returns {void|*}
     */
    registerFillPattern(name, svgString) {
        return this._canvasManager.registerFillPattern(name, svgString)
    }
    /**
     * 获取填充
     * @param id
     * @returns {any}
     */
    getPatternById(id) {
        return this._canvasManager.fillPatternMap.get(id)
    }
    /**
     * 获取所有填充名称
     * @returns {string[]} 填充名称数组
     */
    getPatternNames() {
        // map 转数组
        return Array.from(this._canvasManager.fillPatternMap.values())
    }
    /**
     * 关闭所有工具事件
     */
    _closeDisibleToolEvent() {
        // 禁用平移缩放
        this.setPanZoomStatus(false)
        // 取消选择事件绑定
        this._selectionHandler.unBindSelectEvent()
        // 取消激活当前工具
        this._drawingManager.setActiveTool(false)
    }

    /**
     * 订阅工具变化的核心业务处理
     */
    _subscribeCurrentTool() {
        this._editorState.subscribe("currentTool", (toolType) => {
            // 关闭所有工具事件
            this._closeDisibleToolEvent()
            // 根据工具类型进行初始化
            switch (toolType) {
                case "moveZoom":
                    // 启用平移缩放工具
                    this.setPanZoomStatus(true)
                    break
                case "select":
                    // 启用选择工具
                    this._selectionHandler.bindSelectEvent()
                    break
                case "fullPage":
                    const container = document.getElementById(this._containerId)
                    this._canvasManager._updateCanvasSizeAndGrid(container)
                    break
                case "rect":
                case "circle":
                case "ellipse":
                case "line":
                case "polygon":
                case "polyline":
                case "bezier":
                case "text":
                    // 启用绘图工具
                    this._drawingManager.setActiveTool(toolType)
                    break
            }
            // 触发工具变化事件
            this._eventBus.emit(EventConstant.TOOL_CHANGE, toolType)
        })
    }

    /**
     * 加载 SVG 字符串
     * @param {string} svgString - SVG 字符串
     * @returns {void|*}
     */
    loadSvgString(svgString) {
        const svgEl = SVG(svgString)
        // 递归将数据添加到元素管理器
        if (svgEl.type === "svg") {
            svgEl.children().forEach((child) => {
                this._elementManager.addElementsRecursively(child)
                this._svgCanvas.add(child)
            })
        } else {
            this._elementManager.addElementsRecursively(svgEl)
            this._svgCanvas.add(svgEl)
        }
        return svgEl
    }
    // 导出 SVG 字符串
    exportSvgString() {
        return this._svgCanvas.svg()
    }
    // 导出 DXF 字符串
    exportDxfString() {
        return SvgToDxfConverter.convert(this._svgCanvas)
    }
    get editorState() {
        return this._editorState
    }

    get eventBus() {
        return this._eventBus
    }

    get canvasManager() {
        return this._canvasManager
    }

    get elementManager() {
        return this._elementManager
    }

    get selectionHandler() {
        return this._selectionHandler
    }

    get panZoom() {
        return this._panZoom
    }

    get svgCanvas() {
        return this._svgCanvas
    }

    get containerId() {
        return this._containerId
    }

    get drawingManager() {
        return this._drawingManager
    }

    get historyManager() {
        return this._historyManager
    }
    destroy() {
        // 关闭平移缩放
        this.setPanZoomStatus(false)
        this._panZoom = null
        // 销毁绘图管理器
        this._drawingManager?.destroy()
        this._drawingManager = null
        // 销毁状态管理器
        this._editorState.destroy()
        // 销毁事件管理器
        this._eventBus.destroy()
        // 销毁选择管理器
        this._selectionHandler.destroy()
        // 销毁画板管理器
        this._canvasManager.destroy()
        // 销毁历史记录管理器
        this._historyManager.destroy()
    }
}
