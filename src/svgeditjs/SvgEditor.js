import SVGCoreContext from "./core/SvgCoreContext.js"

/**
 * SVG 编辑器
 */
export default class SVGEditor {
    constructor(containerId, state = {}) {
        this._svgCoreContext = null
        this._containerId = containerId
        this._initState = state
    }
    init() {
        this._svgCoreContext = new SVGCoreContext(this._containerId, this._initState)
        return this
    }
    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 事件处理函数
     * @param {boolean} [once=false] - 是否只执行一次
     * @returns {EventBus} 返回自身，支持链式调用
     */
    on(event, callback, once = false) {
        return this._svgCoreContext?.eventBus.on(event, callback, once)
    }
    /**
     * 订阅一次性事件（执行后自动取消订阅）
     * @param {string} event - 事件名称
     * @param {Function} callback - 事件处理函数
     * @returns {EventBus} 返回自身，支持链式调用
     */
    once(event, callback) {
        return this.on(event, callback, true)
    }
    /**
     * 取消订阅事件
     * @param {string} event - 事件名称
     * @param {Function} [callback] - 可选，指定取消的处理函数；不传则取消该事件的所有处理函数
     * @returns {EventBus} 返回自身，支持链式调用
     */
    off(event, callback) {
        return this._svgCoreContext?.eventBus.off(event, callback)
    }
    /**
     * 设置当前工具
     * @param {string} toolType - 工具类型 (moveZoom/select/rect/circle/ellipse/line/polygon/polyline/bezier/text)
     */
    setTool(toolType) {
        this._svgCoreContext.setTool(toolType)
    }
    /**
     * 重置配置状态
     * @param {Object} state - 状态对象
     */
    resetState(state) {
        this._svgCoreContext.editorState.resetState(state)
    }
    /**
     * 注册填充
     * @param {string} name - 填充名称
     * @param {string} svgString - 填充 SVG 字符串
     * @returns {void|*}
     */
    registerFillPattern(name, svgString) {
        return this._svgCoreContext.registerFillPattern(name, svgString)
    }
    /**
     * 获取填充
     * @param {string} eleId - 填充元素 ID
     * @returns {*}
     */
    getPatternById(eleId) {
        return this._svgCoreContext.getPatternById(eleId)
    }
    /**
     * 获取填充
     * @param {string} name - 填充名称
     * @returns {any}
     */
    getPatternByName(name) {
        return this._svgCoreContext.getPatternByName(name)
    }
    /**
     * 获取所有填充名称
     * @returns {string[]} 填充名称数组
     */
    getPatternNames() {
        return this._svgCoreContext.getPatternNames()
    }
    /**
     * 加载 SVG
     * @param {string} svgString - SVG 字符串
     * @returns {void|*}
     */
    loadSvgString(svgString) {
        return this._svgCoreContext.loadSvgString(svgString)
    }
    /**
     * 导出 SVG 字符串
     * @returns {string} SVG 字符串
     */
    exportSvgString() {
        return this._svgCoreContext.exportSvgString()
    }

    /**
     * 导出 DXF 字符串
     * @returns {string|null} DXF 字符串，失败返回 null
     */
    exportDxfString() {
        return this._svgCoreContext.exportDxfString()
    }
    /**
     * 清除所有元素
     */
    clear() {
        this._svgCoreContext.clear()
    }
    /**
     * 销毁编辑器
     */
    destroy() {
        this._svgCoreContext.destroy()
    }
    get svgCoreContext() {
        return this._svgCoreContext
    }
}
