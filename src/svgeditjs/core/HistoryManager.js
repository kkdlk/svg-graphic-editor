import EventConstant from "../constant/EventConstant.js"

/**
 * 历史记录管理器
 * 负责管理 SVG 编辑器的撤销/重做功能
 */
export default class HistoryManager {
    /**
     * @param {SvgCoreContext} svgCoreContext SVG核心上下文
     */
    constructor(svgCoreContext) {
        this._svgCoreContext = svgCoreContext
        this._eventBus = svgCoreContext.eventBus
        this._editorState = svgCoreContext.editorState
        this._elementManager = svgCoreContext.elementManager
        // 撤销栈
        this._undoStack = []
        // 重做栈
        this._redoStack = []
        // 最大历史记录步数
        this._maxHistory = 50
        // 是否正在执行撤销重做操作
        this._isUndoRedo = false
        this._init()
    }

    _init() {
        // 位置和形状更新
        this._eventBus.on([EventConstant.ELEMENT_FORMAT_DATA], (elementIds) => {
            console.log("位置和形状更新", elementIds)
        })
        // 样式更新
        this._eventBus.on(EventConstant.ELEMENT_UPDATE_DATA, (elementId) => {
            console.log("样式更新", elementId)
        })
        // 新增
        this._eventBus.on(EventConstant.ELEMENT_REGISTER, (elementId) => {
            console.log("新增元素", elementId)
        })
        // 删除
        this._eventBus.on(EventConstant.ELEMENT_REMOVE, (elementId) => {
            console.log("删除元素", elementId)
        })
        // ==================================== 图纸的变化
        // 更新图纸样式
        this._svgCanvasStatusSubscription = this._editorState.subscribe(
            ["svgWidth", "svgHeight", "svgBgColor", "showGrid", "gridSize", "gridLineColor"],
            (svgWidth, svgHeight, svgBgColor, showGrid, gridSize, gridLineColor) => {
                console.log("图纸样式更新", svgWidth, svgHeight, svgBgColor, showGrid, gridSize, gridLineColor)
            }
        )
    }
    destroy() {
        this._eventBus.off([
            EventConstant.ELEMENT_FORMAT_DATA,
            EventConstant.ELEMENT_UPDATE_DATA,
            EventConstant.ELEMENT_REGISTER,
            EventConstant.ELEMENT_REMOVE
        ])
        this._svgCanvasStatusSubscription?.()
    }
}
