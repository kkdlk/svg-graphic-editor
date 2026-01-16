import "@svgdotjs/svg.draw.js"
import { SvgDrawDefaultOptions } from "../constant/BasicConfig"
import EventConstant from "../constant/EventConstant"

/**
 * 基础绘图工具
 * 提供基础的绘图功能，如矩形、圆、椭圆、直线、多边形、折线、曲线等
 * 包含绘制、取消绘制、保留当前绘制图像等功能
 * 事件顺序：
 * 简单绘图: start -> move -> end -> down
 * 复杂绘图: start -> move -> dblclick -> end -> down
 * 取消：start -> move -> cancel -> end
 *
 */
export default class BaseDrawingTool {
    /**
     * 基础绘图工具
     * @param {SvgCoreContext} svgCoreContext
     */
    constructor(svgCoreContext) {
        this._svgCoreContext = svgCoreContext
        this._svgCanvas = svgCoreContext.svgCanvas
        this._editorState = svgCoreContext.editorState
        this._elementManager = svgCoreContext.elementManager
        // 当前绘图元素
        this._drawingElement = null
        // 绘图状态 (drawing,cancel,done,null)
        this._drawingStatus = null
        // 鼠标跟随提示信息元素
        this._tooltipElement = null
        // 需要双击结束的工具类型
        this._doubleClickEndTools = ["polyline", "polygon"]
        // 本次新增的图形id
        this._drawAddList = []
    }

    /**
     * 激活工具
     * @param {string} toolType - 工具类型
     */
    activate(toolType) {
        // 保存当前激活的工具类型
        this._currentToolType = toolType
        // 获取绘制配置
        const isDrawAdoption = this._editorState.getState("drawOptions.isDrawAdoption") // 是否开启绘制吸附
        const showGrid = this._editorState.getState("showGrid") // 是否显示网格
        const gridSize = this._editorState.getState("gridSize") // 网格大小
        // 获取工具的默认样式配置
        const drawStyle = this._editorState.getState(`drawOptions.${toolType}`) || SvgDrawDefaultOptions[toolType]
        // 创建绘图元素并初始化绘制配置
        this._drawingElement = this._svgCanvas[toolType]()
            .attr(drawStyle)
            .draw({
                snapToGrid: showGrid && isDrawAdoption ? gridSize : 1, // 当显示网格且开启吸附时，使用网格大小作为吸附单位
                drawCircles: true // 在直线/折线/多边形的顶点周围绘制小圆，方便用户定位
            })
        // 绑定绘制相关事件
        this._bindDrawEvent()
        // 创建并显示鼠标跟随提示信息
        this._createTooltip()
    }

    /**
     * 取消激活工具
     * @param {boolean} isDrawEnd - 是否触发绘制终止事件
     */
    deactivate(isDrawEnd = true) {
        // 如果存在当前绘图元素，执行取消绘制操作
        if (this._drawingElement) {
            // 更新绘制状态为取消
            this._drawingStatus = "cancel"
            // 取消当前绘制操作
            this._drawingElement?.draw("cancel")
            this._drawingElement?.draw(false)
        }
        // 清理资源
        this._cleanupAfterDrawing()
        // 触发绘制终止事件，通知外部绘制已终止
        if (isDrawEnd) {
            // 触发绘制终止事件，通知外部绘制已终止
            this._svgCoreContext.eventBus.emit(EventConstant.DRAW_TERMINATE, this._drawAddList)
            // 清空新增的图形id列表
            this._drawAddList = []
        }
    }
    /**
     * 绘制结束后的清理工作
     */
    _cleanupAfterDrawing() {
        // 清空当前激活的工具类型
        this._currentToolType = null
        // 重置绘制状态
        this._drawingStatus = null
        // 销毁鼠标跟随提示信息元素
        this._destroyTooltip()
        // 取消绑定所有绘制相关事件
        this._unBindDrawEvent()
        // 清空当前绘图元素引用
        this._drawingElement = null
    }

    /**
     * 销毁
     */
    destroy() {
        this.deactivate(true)
    }

    /**
     * 绑定绘制事件
     */
    _bindDrawEvent() {
        // 绘制开始
        this._drawingElement.on("drawstart", this._onDrawStart.bind(this))
        // 绘制结束(完成，取消均会触发)
        this._drawingElement.on("drawstop", this._onDrawEnd.bind(this))
        // 绑定绘制更新事件
        this._drawingElement.on("drawupdate", this._onDrawUpdate.bind(this))
        // 绑定图纸点击事件
        this._svgCanvas.on("click", this._onCanvasClick.bind(this))
        // 右键点击事件
        this._svgCanvas.on("contextmenu", this._onCanvasContextMenu.bind(this))
    }
    /**
     * 取消绑定绘制事件
     */
    _unBindDrawEvent() {
        this._drawingElement?.off(["drawstart", "drawstop", "drawupdate"])
        // 取消绑定图纸点击事件
        this._svgCanvas?.off(["contextmenu", "click"])
    }

    /**
     * 绘制开始
     * @param {Event} event - 绘制开始事件
     */
    _onDrawStart(event) {
        // 设置绘图状态为绘制中
        this._drawingStatus = "drawing"
        // 触发绘制开始事件
        this._svgCoreContext.eventBus.emit(EventConstant.DRAW_START, this._drawingElement, event)
    }
    /**
     * 绘制更新事件
     * @param {Event} event - 绘制更新事件
     */
    _onDrawUpdate(event) {
        // 触发绘制更新事件
        this._svgCoreContext.eventBus.emit(EventConstant.DRAW_UPDATE, this._drawingElement, event)
    }
    /**
     * 绘制结束
     * @param {Event} event - 绘制结束事件
     */
    _onDrawEnd(event) {
        // 如果绘制状态为绘制中或已完成，保存绘制结果
        if ((!this._doubleClickEndTools.includes(this._currentToolType) && this._drawingStatus === "drawing") || this._drawingStatus === "done") {
            // 触发绘制完成事件，通知外部绘制已完成
            this._svgCoreContext.eventBus.emit(EventConstant.DRAW_DONE, this._drawingElement, event)
            // 将绘制完成的元素注册到元素管理器中
            const elId = this._elementManager.registerElement(this._drawingElement)
            // 记录新增的图形id
            this._drawAddList.push(elId)
        }
        // 获取当前绘图元素的类型，用于后续的连续绘制判断
        const currentToolType = this._drawingElement?.type
        // 触发绘制结束事件，通知外部绘制操作已停止
        this._svgCoreContext.eventBus.emit(EventConstant.DRAW_STOP, this._drawingElement, event)
        // 检查是否开启了连续绘制功能
        const isContinuousDraw = this._editorState.getState("drawOptions.enableContinuousDraw")
        // 清理资源
        this._cleanupAfterDrawing()
        if (isContinuousDraw && currentToolType) {
            // 激活当前工具
            this.activate(currentToolType)
        } else {
            // 触发绘制终止事件，通知外部绘制已终止
            this._svgCoreContext.eventBus.emit(EventConstant.DRAW_TERMINATE, this._drawAddList)
            // 清空新增的图形id列表
            this._drawAddList = []
        }
    }

    /**
     * 图纸点击事件
     * @param {Event} event - 点击事件
     */
    _onCanvasClick(event) {
        // 获取点击次数（1为单击，2为双击）
        const clickCount = event.detail
        // 触发绘制时的画板点击事件，通知外部用户在绘制过程中点击了画板
        this._svgCoreContext.eventBus.emit(EventConstant.DRAW_CANVAS_CLICK, event)
        // 检查是否为双击事件，且当前工具需要双击结束绘制
        const isDoubleClickEndTool = this._doubleClickEndTools.includes(this._drawingElement?.type)
        if (clickCount === 2 && this._drawingElement && isDoubleClickEndTool) {
            // 更新绘制状态为已完成
            this._drawingStatus = "done"
            // 触发绘制元素双击事件，通知外部用户双击了绘制元素
            this._svgCoreContext.eventBus.emit(EventConstant.DRAW_ELEMENT_DBLCLICK, event)
            // 调用draw方法的done命令，完成当前绘制
            this._drawingElement.draw("done")
        }
    }
    /**
     * 图纸右键点击事件
     * @param {Event} event - 右键点击事件
     */
    _onCanvasContextMenu(event) {
        // 阻止浏览器默认的右键菜单
        event.preventDefault()
        // 更新绘制状态为取消
        this._drawingStatus = "cancel"
        // 触发绘制取消事件，通知外部用户取消了绘制
        this._svgCoreContext.eventBus.emit(EventConstant.DRAW_CANCEL, this._drawingElement, event)
        // 如果存在当前绘图元素，调用draw方法的cancel命令取消绘制
        if (this._drawingElement) {
            this._drawingElement.draw("cancel")
        }
    }

    /**
     * 创建鼠标跟随提示信息元素
     */
    _createTooltip() {
        if (this._tooltipElement) return
        this._tooltipElement = document.createElement("div")
        this._tooltipElement.className = "svg-draw-tooltip"
        this._tooltipElement.style.cssText = `
            position: fixed;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 9999;
            white-space: nowrap;
        `
        document.body.appendChild(this._tooltipElement)
        // 绑定鼠标移动事件
        document.addEventListener("mousemove", this._onTooltipMove.bind(this))
    }

    _onTooltipMove(event) {
        // 获取鼠标坐标
        const x = event.clientX || event.pageX
        const y = event.clientY || event.pageY
        // 更新鼠标跟随提示信息
        if (!this._tooltipElement) return
        // 根据工具类型获取提示信息
        const tooltipText = this._getTooltipText(this._drawingElement)
        this._tooltipElement.textContent = tooltipText
        // 更新位置
        this._tooltipElement.style.left = `${x + 10}px`
        this._tooltipElement.style.top = `${y + 15}px`
    }

    /**
     * 根据工具类型获取提示信息
     * @param {Object} element - 当前绘制元素
     * @returns {string} 提示信息
     */
    _getTooltipText(element) {
        if (!element) return ""
        const toolType = this._currentToolType
        const bb = element.bbox()
        const width = Math.round(bb.width)
        const height = Math.round(bb.height)
        let tooltipText = ""
        switch (toolType) {
            case "rect":
                tooltipText = `矩形: ${width} x ${height}，鼠标单击绘制`
                break
            case "circle":
                tooltipText = `圆形: 半径 ${Math.round(width / 2)}，鼠标单击绘制`
                break
            case "ellipse":
                tooltipText = `椭圆: ${width} x ${height}，鼠标单击绘制`
                break
            case "line":
                const length = Math.round(Math.sqrt(width * width + height * height))
                tooltipText = `直线: 长度 ${length}，鼠标单击绘制`
                break
            case "polyline":
            case "polygon":
                // 多边形计算，获取顶点数量
                try {
                    const vertexCount = element.node?.points?.numberOfItems || 0
                    tooltipText = `多边形: ${vertexCount}个顶点，鼠标单击绘制，双击结束`
                } catch (e) {
                    tooltipText = `多边形，鼠标单击绘制，双击结束`
                }
                break
            default:
                tooltipText = `${toolType}: ${width} x ${height}，鼠标单击绘制`
                break
        }
        tooltipText += "，右键取消"
        return tooltipText
    }

    /**
     * 销毁鼠标跟随提示信息元素
     */
    _destroyTooltip() {
        if (this._tooltipElement) {
            document.body.removeChild(this._tooltipElement)
            this._tooltipElement = null
        }
    }
}
