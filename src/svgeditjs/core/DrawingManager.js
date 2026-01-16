import TextDrawingTool from "../drawing/TextDrawingTool.js"
import BezierCurveDrawingTool from "../drawing/BezierCurveDrawingTool.js"
import BaseDrawingTool from "../drawing/BaseDrawingTool.js"

// 工具类型常量
export const DrawingToolType = {
    TEXT: "text",
    BEZIER: "bezier",
    LINE: "line",
    POLYLINE: "polyline",
    POLYGON: "polygon",
    RECT: "rect",
    IMAGE: "image",
    CIRCLE: "circle",
    ELLIPSE: "ellipse"
    // 可以继续添加更多工具类型
}

export default class DrawingManager {
    /**
     * 绘图管理器
     * @param {SvgCoreContext} svgCoreContext - SVG 核心上下文
     */
    constructor(svgCoreContext) {
        this._svgCoreContext = svgCoreContext
        this._svgCanvas = svgCoreContext.svgCanvas
        this._editorState = svgCoreContext.editorState
        this._elementManager = svgCoreContext.elementManager

        // 绘图工具实例缓存
        this._toolInstances = new Map()
        // 当前激活工具实例
        this._activeTool = null
        // 初始化工具
        this._initializeBuiltinTools()
    }

    /**
     * 注册绘图工具
     * @param {string|string[]} toolTypes - 工具类型
     * @param {DrawingTool} toolInstance - 工具实例
     */
    registerTool(toolTypes, toolInstance) {
        const types = Array.isArray(toolTypes) ? toolTypes : [toolTypes]

        types.forEach((type) => {
            if (this._toolInstances.has(type)) {
                console.warn(`绘图工具 "${type}" 已注册，将被覆盖`)
            }
            this._toolInstances.set(type, toolInstance)
        })
    }

    /**
     * 获取工具实例
     * @param {string} toolType - 工具类型
     * @returns {DrawingTool|null}
     */
    getToolInstance(toolType) {
        return this._toolInstances.get(toolType) || null
    }

    /**
     * 获取当前激活工具类型
     * @returns {string|null}
     */
    get activeToolType() {
        return this._editorState.getState("activeDrawTool")
    }

    /**
     * 设置激活工具
     * @param {string|null} toolType - 工具类型，null 表示取消激活
     * @returns {boolean} 是否成功激活
     */
    setActiveTool(toolType) {
        // 如果与当前工具相同，不做任何操作
        if (toolType === this.activeToolType) {
            return true
        }
        // 取消当前激活的工具
        this._deactivateCurrentTool()

        // 如果没有指定工具，清空激活状态
        if (!toolType) {
            this._editorState.setState("activeDrawTool", "")
            return true
        }

        // 获取工具实例
        const toolInstance = this.getToolInstance(toolType)
        if (!toolInstance) {
            console.error(`绘图工具 "${toolType}" 未注册`)
            return false
        }

        // 激活新工具
        if (toolInstance.activate) {
            const activationResult = toolInstance.activate(toolType)
            if (activationResult === false) {
                console.warn(`工具 "${toolType}" 激活失败`)
                return false
            }
        }

        this._activeTool = toolInstance
        this._editorState.setState("activeDrawTool", toolType)

        // console.log(`工具已切换: ${toolType}`)
        return true
    }

    /**
     * 批量注册工具
     * @param {Object.<string, DrawingTool>} tools - 工具映射
     */
    registerTools(tools) {
        Object.entries(tools).forEach(([type, instance]) => {
            this.registerTool(type, instance)
        })
    }

    /**
     * 取消激活当前工具
     * @private
     */
    _deactivateCurrentTool() {
        if (!this._activeTool) return
        if (this._activeTool.deactivate) {
            this._activeTool.deactivate()
        }
        this._activeTool = null
    }

    /**
     * 初始化内置工具
     * @private
     */
    _initializeBuiltinTools() {
        // 基本图形工具
        this.registerTool(
            [
                DrawingToolType.LINE,
                DrawingToolType.POLYLINE,
                DrawingToolType.POLYGON,
                DrawingToolType.RECT,
                DrawingToolType.IMAGE,
                DrawingToolType.CIRCLE,
                DrawingToolType.ELLIPSE
            ],
            new BaseDrawingTool(this._svgCoreContext)
        )
        // 贝塞尔曲线工具
        this.registerTool(DrawingToolType.BEZIER, new BezierCurveDrawingTool(this._svgCoreContext))
        // 文本工具
        this.registerTool(DrawingToolType.TEXT, new TextDrawingTool(this._svgCoreContext))
    }

    /**
     * 工具是否可用
     * @param {string} toolType - 工具类型
     * @returns {boolean}
     */
    isToolAvailable(toolType) {
        return this._toolInstances.has(toolType)
    }

    /**
     * 获取所有可用工具类型
     * @returns {string[]}
     */
    getAvailableTools() {
        return Array.from(this._toolInstances.keys())
    }

    /**
     * 执行工具方法
     * @param {string} toolType - 工具类型
     * @param {string} method - 方法名
     * @param {...any} args - 参数
     * @returns {any}
     */
    executeToolMethod(toolType, method, ...args) {
        const tool = this.getToolInstance(toolType)
        if (!tool) {
            throw new Error(`工具 "${toolType}" 不存在`)
        }
        if (typeof tool[method] !== "function") {
            throw new Error(`工具 "${toolType}" 没有方法 "${method}"`)
        }
        return tool[method](...args)
    }

    /**
     * 销毁管理器
     */
    destroy() {
        // 取消激活当前工具
        this._deactivateCurrentTool()
        // 销毁所有工具实例
        this._toolInstances.forEach((tool, type) => {
            if (tool.destroy) {
                try {
                    tool.destroy()
                } catch (error) {
                    console.error(`销毁工具 "${type}" 时出错:`, error)
                }
            }
        })
        this._toolInstances.clear()
        // 清空状态
        this._editorState.setState("activeDrawTool", "")
    }
}
