import SVGCoreContext from "./SvgCoreContext.js"
import { convertMouseToSvgCoordinates, isRectIntersect } from "../utils/SnapUtils.js"
import EventConstant from "../constant/EventConstant.js"
import { SVG_META_BUILT_ID } from "../constant/BasicConfig.js"

export default class SelectionHandler {
    constructor(svgCoreContext) {
        /** @type {SVGCoreContext} SVG 核心上下文实例 */
        this._svgCoreContext = svgCoreContext
        // 简化调用实例属性
        this._svgCanvas = this._svgCoreContext.svgCanvas
        this._svgElementManage = this._svgCoreContext.elementManager
        this._canvasManager = this._svgCoreContext.canvasManager
        this._eventBus = this._svgCoreContext.eventBus
        this._editorState = this._svgCoreContext.editorState
        // 选择元素列表
        this._selectElementList = []
        // 第一次选择的位置
        this._firstSelectXY = []
        // 是否正在开启框选
        this._isBoxSelecting = false
        // 鼠标框选的范围盒子
        this._mouseSelectRectBox = null
    }
    /**
     * 清理所有选中
     * @param {*} isChangeEmit 是否调用通知用户选中事件
     */
    clearSelectElement(isChangeEmit = true) {
        if (this._selectElementList && this._selectElementList.length > 0) {
            this._unmountSelectElement(this._selectElementList)
        }
        this._selectElementList = []
        isChangeEmit && this._eventBus.emit(EventConstant.SELECT_CHANGE, this._selectElementList)
    }
    /**
     * 添加选中
     * @param {*} elementItem
     */
    addSelectElement(elementItem) {
        const idx = this._selectElementList.findIndex((itemElement) => itemElement.id() === elementItem.id())
        idx === -1 && this._selectElementList.push(elementItem)
        // 增加选中事件
        for (const element of this._selectElementList) {
            element.drag(this._svgCanvas, true)
            element.select({
                createHandle: (group) => {
                    const isGroup = this._isSelectGroup(element) ?? false
                    // 如果是组，添加到这个组内,否则select的拖拽框不会动
                    if (isGroup) {
                        element.add(group)
                    }
                    return group.rect(10, 10).css({ fill: "#fbf705ff" })
                },
                updateHandle: (shape, p) => shape.center(p[0], p[1])
            })
            element.resize()
            // 选中元素拖拽移动事件
            element
                .on("dragmove", (event) => {
                    this._svgElementManage.elementFormatData(this._selectElementList.map((item) => item.id()))
                    this._eventBus.emit(EventConstant.SELECT_DRAG_MOVE, this._selectElementList, event)
                })
                .on("resize", (event) => {
                    this._svgElementManage.elementFormatData(this._selectElementList.map((item) => item.id()))
                    this._eventBus.emit(EventConstant.SELECT_RESIZE, this._selectElementList, event)
                })
        }
        this._eventBus.emit(EventConstant.SELECT_CHANGE, this._selectElementList)
    }

    /**
     * 添加选中
     * @param eleId
     */
    addSelectElementId(eleId) {
        const ele = this._svgElementManage.getElementById(eleId)
        if (ele) {
            this.addSelectElement(ele)
        }
    }

    /**
     * 绑定选择事件
     */
    bindSelectEvent() {
        this._svgCanvas.on("mousedown", this._onMouseDown.bind(this))
        this._svgCanvas.on("mouseup", this._onMouseUp.bind(this))
        this._svgCanvas.on("mousemove", this._onMouseMove.bind(this))
    }
    /**
     * 解绑选择事件
     */
    unBindSelectEvent() {
        this._svgCanvas?.off(["mousedown", "mouseup", "mousemove"])
        // 解绑后清除选中
        this.clearSelectElement(true)
    }

    /**
     * 鼠标按下事件
     * @param {*} event
     */
    _onMouseDown(event) {
        event.preventDefault()
        // 当前工具
        const currentTool = this._editorState.getState("currentTool")
        if (currentTool === "select") {
            // 是否开启框选
            const isBoxSelection = this._editorState.getState("selectOptions.isBoxSelection")
            // 获取 SVG 坐标系统中的鼠标位置
            const svgCoords = convertMouseToSvgCoordinates(event, this._svgCanvas.node)
            // 从元素管理器中根据ID获取选中元素
            let selectedElement = null
            // 是否跳过这个要素
            if (event.target?.id && !this._canvasManager.isElementSkipped(event.target.id)) {
                selectedElement = this._svgElementManage.getElementById(event.target.id)
            }
            if (selectedElement) {
                // 关闭多选
                this._isBoxSelecting = false
                this._firstSelectXY = []
                // 清理旧选中数据
                this.clearSelectElement(false)
                // 如果存在选中元素，将其添加到选中列表
                this.addSelectElement(selectedElement)
            } else if (isBoxSelection) {
                // 如果开启了多选，则记录开始位置
                this._firstSelectXY = [svgCoords.x, svgCoords.y]
                this._isBoxSelecting = true
                // 创建选择框，创建前删除
                this._mouseSelectRectBox && this._mouseSelectRectBox.remove()
                this._mouseSelectRectBox = this._svgCanvas
                    .rect(0, 0)
                    .move(this._firstSelectXY[0], this._firstSelectXY[1])
                    .fill("rgba(41, 151, 248, 0.05)")
                    .stroke({
                        color: "rgb(41, 151, 248)",
                        width: 1.5
                    })
            } else {
                this._isBoxSelecting = false
                this._firstSelectXY = []
                // 清理旧选中数据
                this.clearSelectElement(true)
            }
        }
    }
    /**
     * 鼠标移动事件
     * @param {*} event
     */
    _onMouseMove(event) {
        event.preventDefault()
        const currentTool = this._editorState.getState("currentTool")
        // 鼠标框选的框跟随移动
        if (currentTool === "select" && this._isBoxSelecting && this._mouseSelectRectBox) {
            // 获取 SVG 坐标系统中的鼠标位置
            const svgCoords = convertMouseToSvgCoordinates(event, this._svgCanvas.node)
            const startX = this._firstSelectXY[0]
            const startY = this._firstSelectXY[1]
            const currentX = svgCoords.x
            const currentY = svgCoords.y
            const x = Math.min(startX, currentX)
            const y = Math.min(startY, currentY)
            const width = Math.abs(currentX - startX)
            const height = Math.abs(currentY - startY)
            this._mouseSelectRectBox.move(x, y).size(width, height)
        }
    }
    /**
     * 鼠标松开事件
     * @param {*} event
     */
    _onMouseUp(event) {
        event.preventDefault()
        const currentTool = this._editorState.getState("currentTool")
        if (currentTool === "select" && this._isBoxSelecting) {
            if (this._mouseSelectRectBox) {
                // 框选结束，清空旧的选择
                this._isBoxSelecting = false
                this.clearSelectElement(false)
                // 获取框选内的元素
                const selectedElements = this.getElementsInSelectionBox(
                    this._mouseSelectRectBox,
                    this._canvasManager.isElementSkipped.bind(this._canvasManager)
                )
                // 如果框选的元素大于1个，则将这些元素变为组，开启组的拖拽，拖拽结束后需要删除组，修改组内元素
                if (selectedElements.length > 1) {
                    // 创建一个新的组，将元素添加到组内
                    const groupBox = this._svgCanvas.group()
                    selectedElements.forEach((element) => {
                        // 把元素添加到组内
                        groupBox.add(element)
                        // 从数据列表中删除，但是不删除dom
                        this._svgElementManage.removeElement(element.id(), false)
                    })
                    const groupBoxBounds = groupBox.bbox()
                    // 选中组
                    const groupBoxDragRect = this._svgCanvas
                        .rect(groupBoxBounds.width, groupBoxBounds.height)
                        .move(groupBoxBounds.x, groupBoxBounds.y)
                        .fill("#02030418")
                        .stroke({ color: "rgb(41, 151, 248)", width: 1.5 })
                        .id(SVG_META_BUILT_ID.multiSelectFrameId)
                    groupBox.add(groupBoxDragRect)
                    // 添加到图层列表,因为选中需要从图层列表判断
                    this._svgElementManage.registerElement(groupBox, {
                        id: SVG_META_BUILT_ID.selectGroupId
                    })
                    // 添加到选中
                    this.addSelectElement(groupBox)
                } else {
                    selectedElements.length > 0 && this.addSelectElement(selectedElements[0])
                }
                this._mouseSelectRectBox.remove()
                this._mouseSelectRectBox = null
            }
        }
    }
    /**
     * 是否是选择组
     * @param {*} element
     * @returns
     */
    _isSelectGroup(element) {
        return element.id() === SVG_META_BUILT_ID.selectGroupId
    }
    /**
     * 卸载选中列表，并关闭事件
     * @param {Array} delElementList 选中的元素列表
     */
    _unmountSelectElement(delElementList) {
        delElementList.forEach((itemElement) => {
            // 关闭事件
            itemElement.drag(this._svgCanvas, false).select(false).resize(false)
            // 大坑，关闭后不会卸载事件，图纸事件无法触发元素
            itemElement.off()
            const isGroup = this._isSelectGroup(itemElement) || false
            if (isGroup) {
                // 如果是组，将组删除，将元素拆分回去
                for (const childElement of itemElement.children()) {
                    //  元素内如果是多选的框，跳过
                    if (childElement.id() === SVG_META_BUILT_ID.multiSelectFrameId) {
                        // 删除原元素
                        childElement.remove()
                        continue
                    }
                    const element = childElement.clone(true)
                    // 关闭所有事件
                    element.off()
                    // 将元素添加到要素列表，并从祖内移动回去
                    this._svgCanvas.add(element)
                    // 删除原元素
                    childElement.remove()
                    // 添加到图层管理器
                    this._svgElementManage.registerElement(element, { ...element.attr() })
                }
                // 删除要素并删除dom
                this._svgElementManage.removeElement(itemElement.id(), true)
            }
        })
    }
    /**
     * 获取选择框内的元素
     * @param {*} selBox 绘制的选择框外包矩形
     * @param {*} svgElementManage 元素管理器
     * @param {*} skipElement 跳过的元素
     * @returns 选择框内满足要求的元素的元素
     */
    getElementsInSelectionBox(selBox, skipElement) {
        const selectedElements = []
        const allElements = this._svgElementManage.getAllElements((element, data) => !skipElement(data.id))
        const selectionBoxBounds = selBox.bbox()
        allElements.map((element) => {
            const elementBBox = element.bbox()
            // 判断矩形是否相交
            const isSelected = isRectIntersect(selectionBoxBounds, elementBBox)
            isSelected && selectedElements.push(element)
        })
        return selectedElements
    }
    destroy() {
        // 选择元素列表
        this._selectElementList = []
        // 第一次选择的位置
        this._firstSelectXY = []
        // 是否正在开启框选
        this._isBoxSelecting = false
        // 鼠标框选的范围盒子
        this._mouseSelectRectBox = null
    }
}
