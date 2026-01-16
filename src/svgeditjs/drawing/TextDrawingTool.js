import { SvgDrawDefaultOptions } from "../constant/BasicConfig"
import EventConstant from "../constant/EventConstant"
import { convertMouseToSvgCoordinates } from "../utils/SnapUtils"

/**
 * 优化版文本绘图工具类
 */
export default class TextDrawingTool {
    constructor(svgCoreContext) {
        this._svgCoreContext = svgCoreContext
        this._svgCanvas = svgCoreContext.svgCanvas
        this._editorState = svgCoreContext.editorState
        this._elementManager = svgCoreContext.elementManager
        this._eventBus = svgCoreContext.eventBus

        // 当前工具图形类型
        this._currentToolType = null
        this._drawingElement = null
        // 本次新增的图形id
        this._drawAddList = []
    }

    /**
     * 激活文本工具
     */
    activate(toolType) {
        this._currentToolType = toolType
        // 绑定事件
        this._svgCanvas.on("click", this._svgClickEvent.bind(this))
    }
    /**
     * 取消激活文本工具
     */
    deactivate(isDrawEnd = true) {
        this._unBindCanvasEvent()
        this._drawingElement = null
        if (isDrawEnd) {
            // 触发绘制终止事件，通知外部绘制已终止
            this._svgCoreContext.eventBus.emit(EventConstant.DRAW_TERMINATE, this._drawAddList)
            // 清空新增的图形id列表
            this._drawAddList = []
        }
    }

    /**
     * 销毁工具实例
     */
    destroy() {
        this.deactivate(true)
    }

    // 解绑
    _unBindCanvasEvent() {
        this._svgCanvas.off("click")
    }
    // 图层点击事件
    _svgClickEvent(event) {
        // 坐标转换
        const { x, y } = convertMouseToSvgCoordinates(event, this._svgCanvas.node)
        // 触发绘制开始事件
        this._svgCoreContext.eventBus.emit(EventConstant.DRAW_START, this._drawingElement, event)
        // 触发绘制时的画板点击事件，通知外部用户在绘制过程中点击了画板
        this._svgCoreContext.eventBus.emit(EventConstant.DRAW_CANVAS_CLICK, event)
        const drawStyle = this._editorState.getState(`drawOptions.${this._currentToolType}`) || SvgDrawDefaultOptions[this._currentToolType] || {}
        // 创建
        const plainText = this._svgCanvas
            .text()
            .plain("选择修改文字内容")
            .move(x, y)
            .attr({
                ...drawStyle,
                "font-size": drawStyle["font-size"] || 16
            })
        this._drawingElement = plainText
        // 将组添加到元素
        const elementId = this._elementManager.registerElement(plainText)
        this._drawAddList.push(elementId)
        this._svgCoreContext.eventBus.emit(EventConstant.DRAW_STOP, this._drawingElement, event)
        this._svgCoreContext.eventBus.emit(EventConstant.DRAW_DONE, this._drawingElement, event)
        // 检查是否开启了连续绘制功能
        const isContinuousDraw = this._editorState.getState("drawOptions.enableContinuousDraw")
        if (isContinuousDraw && this._currentToolType) {
            this.deactivate(false)
            // 激活当前工具
            this.activate(this._currentToolType)
        } else {
            this.deactivate(true)
        }
    }
}
