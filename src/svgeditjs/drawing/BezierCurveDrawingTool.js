import { SvgDrawDefaultOptions, SVG_METADATA } from "../constant/BasicConfig"
import EventConstant from "../constant/EventConstant"
import { convertMouseToSvgCoordinates } from "../utils/SnapUtils"

export default class BezierCurveDrawingTool {
    // 常量定义
    static ANCHOR_POINT_RADIUS = 5
    static CONTROL_POINT_RADIUS = 3
    static CLICK_THRESHOLD_SQUARED = 25 // 5的平方，避免开方运算
    static CONTROL_LINE_STYLE = { stroke: "#cccccc", "stroke-width": 1, "stroke-dasharray": "4,4" }
    static ANCHOR_POINT_STYLE = { fill: "#eeeeee", stroke: "#000000", "stroke-width": 1 }
    static CONTROL_POINT_STYLE = { fill: "#ff0000" }

    /**
     * 贝塞尔曲线绘图工具
     * 支持n阶贝塞尔曲线绘制，用户通过点击添加控制点，双击结束绘制
     * @param {SvgCoreContext} svgCoreContext
     */
    constructor(svgCoreContext) {
        this._svgCoreContext = svgCoreContext
        this._svgCanvas = svgCoreContext.svgCanvas
        this._editorState = svgCoreContext.editorState
        this._elementManager = svgCoreContext.elementManager
        // 当前激活的工具类型
        this._currentToolType = null
        // 绘图状态 (drawing,cancel,done,null)
        this._drawingStatus = null
        // 曲线上的端点
        this._bezierPoints = []
        // 贝塞尔曲线元素
        this._drawingElement = null
        // 控制元素映射，用于复用DOM元素
        this._controlElementsMap = new Map() // 格式: {pointIndex: {anchor: element, controlIn: {line, point}, controlOut: {line, point}}}
        // 拖拽状态
        this._isDragging = false
        this._draggedPointIndex = -1
        this._isDraggingControl = false
        this._draggedControlIndex = -1
        // 控制点调整状态
        this._isAdjustingControl = false
        this._currentAnchorIndex = -1
        this._tempControlOut = null
        this._tempControlIn = null
        // 最后鼠标位置
        this._lastMousePos = null
        // 本次新增的图形id
        this._drawAddList = []
        // 预先绑定事件处理函数
        this._onCanvasContextMenu = this._onCanvasContextMenu.bind(this)
        this._onCanvasMouseDown = this._onCanvasMouseDown.bind(this)
        this._onCanvasMouseMove = this._onCanvasMouseMove.bind(this)
        this._onCanvasMouseUp = this._onCanvasMouseUp.bind(this)
        this._onCanvasDblClick = this._onCanvasDblClick.bind(this)
    }

    /**
     * 激活工具
     */
    activate(toolType) {
        // 保存当前激活的工具类型
        this._currentToolType = toolType
        // 获取工具的默认样式配置
        const drawStyle = this._editorState.getState(`drawOptions.${toolType}`) || SvgDrawDefaultOptions[toolType]
        // 重置绘图状态
        this._resetState()
        // 创建绘图元素并初始化绘制配置
        this._drawingElement = this._svgCanvas.path(["M", 0, 0]).attr(drawStyle)
        // 绑定绘制相关事件
        this._bindDrawEvent()
    }

    /**
     * 停用工具
     * @param {boolean} isDrawEnd - 是否触发绘制终止事件
     */
    deactivate(isDrawEnd = true) {
        // 更新绘制状态为取消
        this._drawingStatus = "cancel"
        // 移除绘图元素
        if (this._drawingElement) {
            // 如果绘制未完成，移除临时绘图元素
            if (this._drawingStatus !== "done") {
                this._drawingElement.remove()
            }
            this._drawingElement = null
        }
        // 资源清理
        this._cleanupAfterDrawing()
        // 触发绘制终止事件
        if (isDrawEnd) {
            this._svgCoreContext.eventBus.emit(EventConstant.DRAW_TERMINATE, this._drawAddList)
            // 清空新增的图形id列表
            this._drawAddList = []
        }
    }
    /**
     * 销毁
     */
    destroy() {
        this.deactivate(true)
    }

    /**
     * 取消绑定绘制事件
     */
    _unBindDrawEvent() {
        this._svgCanvas.off("contextmenu", this._onCanvasContextMenu)
        this._svgCanvas.off("mousedown", this._onCanvasMouseDown)
        this._svgCanvas.off("mousemove", this._onCanvasMouseMove)
        this._svgCanvas.off("mouseup", this._onCanvasMouseUp)
        this._svgCanvas.off("dblclick", this._onCanvasDblClick)
    }

    _bindDrawEvent() {
        // 右键点击事件
        this._svgCanvas.on("contextmenu", this._onCanvasContextMenu)
        // 鼠标按下事件
        this._svgCanvas.on("mousedown", this._onCanvasMouseDown)
        // 鼠标移动事件
        this._svgCanvas.on("mousemove", this._onCanvasMouseMove)
        // 鼠标松开事件
        this._svgCanvas.on("mouseup", this._onCanvasMouseUp)
        // 鼠标双击事件
        this._svgCanvas.on("dblclick", this._onCanvasDblClick)
    }

    _cleanupAfterDrawing() {
        // 清理临时元素
        this._resetState()
        // 取消绑定事件
        this._unBindDrawEvent()
        // 清理引用
        this._drawingElement = null
    }
    /**
     * 处理画布双击事件
     */
    _onCanvasDblClick(event) {
        // 结束绘制
        if (this._drawingStatus === "drawing") {
            // 完成绘制，注册元素，触发绘制完成事件
            // 转换鼠标坐标到SVG坐标
            const mousePos = convertMouseToSvgCoordinates(event, this._svgCanvas.node)
            // 检查是否点击在现有锚点或控制柄上
            const clickedPointIndex = this._getClickedPointIndex(mousePos)
            // 当前状态设置为完成
            this._drawingStatus = "done"
            // 获取当前绘图元素的类型
            const currentToolType = this._currentToolType
            let isPathClosed = false
            // 清理最后一个点的控制点
            if (this._bezierPoints.length > 0) {
                this._bezierPoints[this._bezierPoints.length - 1].controlOut = null
                // 检查是否需要闭合路径（如果双击了起点）
                // 检查是否双击起点（第一个锚点）
                if (this._bezierPoints.length > 2 && clickedPointIndex === 0) {
                    const pathArray = this._createPathArray()
                    pathArray.push(["Z"])
                    this._drawingElement.plot(pathArray)
                    isPathClosed = true
                } else {
                    this._updateDrawing()
                    isPathClosed = false
                }
            }
            // 完成绘制流程
            const elId = this._elementManager.registerElement(this._drawingElement, { [SVG_METADATA.isPathClosed]: isPathClosed })
            this._drawAddList.push(elId)
            // 触发绘制完成事件，通知外部绘制已完成
            this._svgCoreContext.eventBus.emit(EventConstant.DRAW_DONE, this._drawingElement, event)
            // 清理临时元素
            this._cleanupAfterDrawing()
            // 触发绘制结束事件，通知外部绘制操作已停止
            this._svgCoreContext.eventBus.emit(EventConstant.DRAW_STOP, this._drawingElement, event)
            // 检查是否开启了连续绘制
            const isContinuousDraw = this._editorState.getState("drawOptions.enableContinuousDraw")
            if (isContinuousDraw && currentToolType) {
                // 如果开启了连续绘制且当前工具类型有效，则重新激活该工具，允许用户继续绘制
                this.activate(currentToolType)
            } else {
                // 触发绘制终止事件
                this._svgCoreContext.eventBus.emit(EventConstant.DRAW_TERMINATE, this._drawAddList)
                // 清空新增的图形id列表
                this._drawAddList = []
            }
        }
    }
    /**
     * 重置所有绘图状态
     */
    _resetState() {
        this._drawingStatus = null
        this._bezierPoints = []
        this._isDragging = false
        this._draggedPointIndex = -1
        this._isDraggingControl = false
        this._draggedControlIndex = -1
        this._isAdjustingControl = false
        this._currentAnchorIndex = -1
        this._tempControlOut = null
        this._tempControlIn = null
        this._lastMousePos = null
        // 清空控制元素映射
        this._clearControlElements()
    }

    /**
     * 清除所有控制元素
     */
    _clearControlElements() {
        this._controlElementsMap.forEach((elements) => {
            elements.anchor.remove()
            if (elements.controlIn) {
                elements.controlIn.line.remove()
                elements.controlIn.point.remove()
            }
            if (elements.controlOut) {
                elements.controlOut.line.remove()
                elements.controlOut.point.remove()
            }
        })
        this._controlElementsMap.clear()
    }

    /**
     * 处理画布右键点击事件
     */
    _onCanvasContextMenu(event) {
        event.preventDefault()
        // 更新绘制状态为取消
        this._drawingStatus = "cancel"
        // 触发绘制取消事件，通知外部用户取消了绘制
        this._svgCoreContext.eventBus.emit(EventConstant.DRAW_CANCEL, this._drawingElement, event)
        // 移除绘图元素
        if (this._drawingElement) {
            // 如果绘制未完成，移除临时绘图元素
            if (this._drawingStatus !== "done") {
                this._drawingElement.remove()
            }
            this._drawingElement = null
        }
        // 资源清理
        this._cleanupAfterDrawing()
        // 开启绘制
        this.activate(this._currentToolType)
    }
    /**
     * 处理画布鼠标按下事件
     * @param {MouseEvent} event - 鼠标事件对象
     */
    _onCanvasMouseDown(event) {
        // 转换鼠标坐标到SVG坐标
        const mousePos = convertMouseToSvgCoordinates(event, this._svgCanvas.node)
        this._lastMousePos = mousePos

        // 检查是否点击在现有锚点或控制柄上
        const clickedPointIndex = this._getClickedPointIndex(mousePos)
        const clickedControlIndex = this._getClickedControlIndex(mousePos)

        if (clickedPointIndex !== -1) {
            // 点击在锚点上，开始拖拽锚点
            this._isDragging = true
            this._draggedPointIndex = clickedPointIndex
        } else if (clickedControlIndex !== -1) {
            // 点击在控制柄上，开始拖拽控制柄
            this._isDraggingControl = true
            this._draggedControlIndex = clickedControlIndex
        } else if (this._drawingStatus === "drawing" || this._drawingStatus === null) {
            // 开始绘制或继续绘制
            if (this._drawingStatus === null) {
                // 第一个点，开始绘制
                this._drawingStatus = "drawing"
                const firstPoint = {
                    x: mousePos.x,
                    y: mousePos.y,
                    controlIn: null,
                    controlOut: null
                }
                this._bezierPoints.push(firstPoint)
                this._updateDrawing()
                this._createSvgPoints()
                this._svgCoreContext.eventBus.emit(EventConstant.DRAW_START, this._drawingElement, event)
            } else if (this._bezierPoints.length >= 1) {
                // 后续的点，创建新锚点并立即进入控制点调整模式
                const newPoint = {
                    x: mousePos.x,
                    y: mousePos.y,
                    controlIn: null,
                    controlOut: null
                }

                this._bezierPoints.push(newPoint)
                this._isAdjustingControl = true
                this._currentAnchorIndex = this._bezierPoints.length - 2 // 当前是调整上一个点的出控制点

                // 创建临时控制柄（初始位置与锚点重合）
                const lastPoint = this._bezierPoints[this._currentAnchorIndex]
                this._tempControlOut = { x: lastPoint.x, y: lastPoint.y }
                this._tempControlIn = { x: mousePos.x, y: mousePos.y }

                this._updateDrawing()
                this._createSvgPoints()
            }
        }
    }
    /**
     * 检测点击位置是否在锚点上
     */
    _getClickedPointIndex(mousePos) {
        for (let i = 0; i < this._bezierPoints.length; i++) {
            const point = this._bezierPoints[i]
            const dx = point.x - mousePos.x
            const dy = point.y - mousePos.y
            if (dx * dx + dy * dy <= BezierCurveDrawingTool.CLICK_THRESHOLD_SQUARED) {
                return i
            }
        }
        return -1
    }

    /**
     * 检测点击位置是否在控制柄上
     */
    _getClickedControlIndex(mousePos) {
        for (let i = 0; i < this._bezierPoints.length; i++) {
            const point = this._bezierPoints[i]

            // 检查入控制点
            if (point.controlIn) {
                const dx = point.controlIn.x - mousePos.x
                const dy = point.controlIn.y - mousePos.y
                if (dx * dx + dy * dy <= BezierCurveDrawingTool.CLICK_THRESHOLD_SQUARED) {
                    return i * 2 // 入控制点用偶数索引
                }
            }

            // 检查出控制点
            if (point.controlOut) {
                const dx = point.controlOut.x - mousePos.x
                const dy = point.controlOut.y - mousePos.y
                if (dx * dx + dy * dy <= BezierCurveDrawingTool.CLICK_THRESHOLD_SQUARED) {
                    return i * 2 + 1 // 出控制点用奇数索引
                }
            }
        }
        return -1
    }

    /**
     * 更新曲线绘制
     */
    _updateDrawing(mousePos = null) {
        // 确保绘图元素存在
        if (!this._drawingElement) return
        if (this._bezierPoints.length === 0) {
            // 没有贝塞尔点时，设置一个空路径
            this._drawingElement.array(["M", 0, 0])
            return
        }
        // 创建新的路径数组
        const pathArray = this._createPathArray(mousePos)
        // 设置路径数组
        this._drawingElement.plot(pathArray)
    }

    /**
     * 创建路径数组
     */
    _createPathArray(mousePos = null) {
        const pathArray = [["M", this._bezierPoints[0].x, this._bezierPoints[0].y]]
        // 绘制已确定的曲线段
        this._addExistingCurveSegments(pathArray)
        // 如果有鼠标位置且处于绘制状态，添加预览段
        if (mousePos && this._drawingStatus === "drawing") {
            this._addPreviewSegment(pathArray, mousePos)
        }
        return pathArray
    }

    /**
     * 添加已确定的曲线段
     */
    _addExistingCurveSegments(pathArray) {
        for (let i = 1; i < this._bezierPoints.length; i++) {
            const currentPoint = this._bezierPoints[i]
            const previousPoint = this._bezierPoints[i - 1]

            let controlOut = previousPoint.controlOut
            let controlIn = currentPoint.controlIn

            // 如果正在调整当前段的控制点，使用临时控制点
            if (this._isAdjustingControl && this._currentAnchorIndex === i - 1) {
                controlOut = this._tempControlOut
                controlIn = this._tempControlIn
            }

            this._addCurveSegment(pathArray, previousPoint, currentPoint, controlOut, controlIn)
        }
    }

    /**
     * 添加单个曲线段
     */
    _addCurveSegment(pathArray, previousPoint, currentPoint, controlOut, controlIn) {
        if (controlOut && controlIn) {
            // 贝塞尔曲线段
            pathArray.push(["C", controlOut.x, controlOut.y, controlIn.x, controlIn.y, currentPoint.x, currentPoint.y])
        } else {
            // 直线段
            pathArray.push(["L", currentPoint.x, currentPoint.y])
        }
    }

    /**
     * 添加预览曲线段
     */
    _addPreviewSegment(pathArray, mousePos) {
        const lastPoint = this._bezierPoints[this._bezierPoints.length - 1]
        if (lastPoint.controlOut) {
            // 如果最后一个点有出控制点，使用贝塞尔曲线预览
            const dx = mousePos.x - lastPoint.x
            const dy = mousePos.y - lastPoint.y
            const controlIn = { x: mousePos.x - dx * 0.3, y: mousePos.y - dy * 0.3 }
            pathArray.push(["C", lastPoint.controlOut.x, lastPoint.controlOut.y, controlIn.x, controlIn.y, mousePos.x, mousePos.y])
        } else {
            // 否则使用直线预览
            pathArray.push(["L", mousePos.x, mousePos.y])
        }
    }

    /**
     * 创建或更新视觉上的锚点和控制柄
     * 优化策略：复用现有的DOM元素，避免频繁删除和重建
     */
    _createSvgPoints() {
        // 确保SVG画布存在
        if (!this._svgCanvas) return

        // 创建控制元素的辅助方法
        const createAnchorPoint = (x, y) => {
            return this._svgCanvas
                .circle(BezierCurveDrawingTool.ANCHOR_POINT_RADIUS)
                .attr({ cx: x, cy: y, ...BezierCurveDrawingTool.ANCHOR_POINT_STYLE })
        }
        const createControlLine = (x1, y1, x2, y2) => {
            return this._svgCanvas.line(x1, y1, x2, y2).attr(BezierCurveDrawingTool.CONTROL_LINE_STYLE)
        }
        const createControlPoint = (x, y) => {
            return this._svgCanvas
                .circle(BezierCurveDrawingTool.CONTROL_POINT_RADIUS)
                .attr({ cx: x, cy: y, ...BezierCurveDrawingTool.CONTROL_POINT_STYLE })
        }
        // 处理每个贝塞尔点
        this._bezierPoints.forEach((point, index) => {
            let controlIn = point.controlIn
            let controlOut = point.controlOut

            // 如果正在调整当前点的控制点，使用临时控制点
            if (this._isAdjustingControl) {
                if (index === this._currentAnchorIndex) {
                    controlOut = this._tempControlOut
                } else if (index === this._currentAnchorIndex + 1) {
                    controlIn = this._tempControlIn
                }
            }

            // 获取或创建该点的控制元素集合
            let pointElements = this._controlElementsMap.get(index)
            if (!pointElements) {
                pointElements = { anchor: null, controlIn: null, controlOut: null }
                this._controlElementsMap.set(index, pointElements)
            }

            // 更新或创建锚点
            if (pointElements.anchor) {
                pointElements.anchor.attr({ cx: point.x, cy: point.y })
            } else {
                pointElements.anchor = createAnchorPoint(point.x, point.y)
            }

            // 更新或创建入控制点
            if (controlIn) {
                if (pointElements.controlIn) {
                    // 更新现有元素
                    pointElements.controlIn.line.attr({ x1: point.x, y1: point.y, x2: controlIn.x, y2: controlIn.y })
                    pointElements.controlIn.point.attr({ cx: controlIn.x, cy: controlIn.y })
                } else {
                    // 创建新元素
                    pointElements.controlIn = {
                        line: createControlLine(point.x, point.y, controlIn.x, controlIn.y),
                        point: createControlPoint(controlIn.x, controlIn.y)
                    }
                }
            } else if (pointElements.controlIn) {
                // 移除不再需要的入控制点
                pointElements.controlIn.line.remove()
                pointElements.controlIn.point.remove()
                pointElements.controlIn = null
            }

            // 更新或创建出控制点
            if (controlOut) {
                if (pointElements.controlOut) {
                    // 更新现有元素
                    pointElements.controlOut.line.attr({ x1: point.x, y1: point.y, x2: controlOut.x, y2: controlOut.y })
                    pointElements.controlOut.point.attr({ cx: controlOut.x, cy: controlOut.y })
                } else {
                    // 创建新元素
                    pointElements.controlOut = {
                        line: createControlLine(point.x, point.y, controlOut.x, controlOut.y),
                        point: createControlPoint(controlOut.x, controlOut.y)
                    }
                }
            } else if (pointElements.controlOut) {
                // 移除不再需要的出控制点
                pointElements.controlOut.line.remove()
                pointElements.controlOut.point.remove()
                pointElements.controlOut = null
            }
        })

        // 移除超出当前点数量的控制元素
        const currentPointCount = this._bezierPoints.length
        for (let index = this._controlElementsMap.size - 1; index >= currentPointCount; index--) {
            const pointElements = this._controlElementsMap.get(index)
            if (pointElements) {
                pointElements.anchor.remove()
                if (pointElements.controlIn) {
                    pointElements.controlIn.line.remove()
                    pointElements.controlIn.point.remove()
                }
                if (pointElements.controlOut) {
                    pointElements.controlOut.line.remove()
                    pointElements.controlOut.point.remove()
                }
                this._controlElementsMap.delete(index)
            }
        }
    }

    /**
     * 处理画布鼠标移动事件
     * @param {MouseEvent} event - 鼠标事件对象
     */
    _onCanvasMouseMove(event) {
        const mousePos = convertMouseToSvgCoordinates(event, this._svgCanvas.node)

        if (this._isDragging) {
            // 拖拽锚点
            this._dragPoint(this._draggedPointIndex, mousePos)
        } else if (this._isDraggingControl) {
            // 拖拽控制柄
            this._dragControl(this._draggedControlIndex, mousePos)
        } else if (this._isAdjustingControl) {
            // 调整控制点模式，更新临时控制柄位置
            this._tempControlOut = { x: mousePos.x, y: mousePos.y }
            // 对称更新入控制点
            const lastPoint = this._bezierPoints[this._currentAnchorIndex]
            const currentPoint = this._bezierPoints[this._currentAnchorIndex + 1]
            const dx = lastPoint.x - mousePos.x
            const dy = lastPoint.y - mousePos.y
            this._tempControlIn = { x: currentPoint.x + dx, y: currentPoint.y + dy }
            this._updateDrawing()
            this._createSvgPoints()
        } else if (this._drawingStatus === "drawing" && this._bezierPoints.length > 0) {
            // 预览曲线
            this._updateDrawing(mousePos)
        }

        this._lastMousePos = mousePos
    }
    /**
     * 拖拽锚点
     */
    _dragPoint(pointIndex, mousePos) {
        // 确保点索引有效
        if (pointIndex < 0 || pointIndex >= this._bezierPoints.length) return

        const point = this._bezierPoints[pointIndex]
        // 确保点存在
        if (!point) return

        const dx = mousePos.x - point.x
        const dy = mousePos.y - point.y

        // 更新锚点位置
        point.x = mousePos.x
        point.y = mousePos.y

        // 同时移动相关的控制柄
        if (point.controlIn) {
            point.controlIn.x += dx
            point.controlIn.y += dy
        }
        if (point.controlOut) {
            point.controlOut.x += dx
            point.controlOut.y += dy
        }

        // 更新曲线和视觉元素
        this._updateDrawing()
        this._createSvgPoints()
    }

    /**
     * 拖拽控制柄
     */
    _dragControl(controlIndex, mousePos) {
        const pointIndex = Math.floor(controlIndex / 2)
        // 确保点索引有效
        if (pointIndex < 0 || pointIndex >= this._bezierPoints.length) return

        const isOutControl = controlIndex % 2 === 1
        const point = this._bezierPoints[pointIndex]
        // 确保点存在
        if (!point) return

        // 更新控制点位置
        const targetControl = isOutControl ? "controlOut" : "controlIn"
        point[targetControl] = { x: mousePos.x, y: mousePos.y }

        // 如果是对称控制，同时更新对应的控制点
        const oppositeControl = isOutControl ? "controlIn" : "controlOut"
        if (point[oppositeControl]) {
            const dx = point.x - mousePos.x
            const dy = point.y - mousePos.y
            point[oppositeControl] = { x: point.x + dx, y: point.y + dy }
        }

        // 更新曲线和视觉元素
        this._updateDrawing()
        this._createSvgPoints()
    }

    /**
     * 处理画布鼠标松开事件
     * @param {MouseEvent} event - 鼠标事件对象
     */
    _onCanvasMouseUp(event) {
        // 结束拖拽
        this._isDragging = false
        this._isDraggingControl = false
        this._draggedPointIndex = -1
        this._draggedControlIndex = -1

        // 如果正在调整控制点，确认临时控制点位置
        if (this._isAdjustingControl) {
            // 保存临时控制点到实际属性
            const previousPoint = this._bezierPoints[this._currentAnchorIndex]
            const currentPoint = this._bezierPoints[this._currentAnchorIndex + 1]

            previousPoint.controlOut = this._tempControlOut
            currentPoint.controlIn = this._tempControlIn

            // 重置调整状态
            this._isAdjustingControl = false
            this._currentAnchorIndex = -1
            this._tempControlOut = null
            this._tempControlIn = null

            // 更新绘图和视觉元素
            this._updateDrawing()
            this._createSvgPoints()
        }
    }
}
