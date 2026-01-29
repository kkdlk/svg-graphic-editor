export default {
    // =====================元素数据变化
    /**
     * 元素格式化数据事件
     */
    ELEMENT_FORMAT_DATA: "element:formatData",
    /**
     * 元素更新数据事件
     */
    ELEMENT_UPDATE_DATA: "element:updateData",
    // =====================选中数据变化
    /**
     * 选中事件
     */
    SELECT_CHANGE: "select:change",
    /**
     * 选中元素拖拽移动事件
     */
    SELECT_DRAG_MOVE: "select:dragmove",
    /**
     * 选中元素拖拽结束事件
     */
    SELECT_DRAG_END: "select:dragend",
    /**
     * 选中元素缩放前事件
     */
    SELECT_RESIZE_END: "select:beforeresize",
    /**
     * 选中元素缩放事件
     */
    SELECT_RESIZE: "select:resize",
    /**
     * 选中元素删除事件
     */
    SELECT_REMOVE: "select:remove",
    // ===================== 当前功能
    /**
     * 工具变化事件
     */
    TOOL_CHANGE: "tool:change",
    // =====================绘制
    /**
     * 绘制开始事件
     */
    DRAW_START: "draw:start",
    /**
     * 绘制结束事件（可能存在连续绘制，会自动启动，结束不是结束一次）
     */
    DRAW_STOP: "draw:stop",
    /**
     * 绘制更新事件
     */
    DRAW_UPDATE: "draw:update",
    /**
     * 绘制取消事件
     */
    DRAW_CANCEL: "draw:cancel",
    /**
     * 保留当前绘制图像
     */
    DRAW_DONE: "draw:done",
    /**
     * 绘制点击画板事件
     */
    DRAW_CANVAS_CLICK: "draw:click",
    /**
     * 绘制点击元素事件
     */
    DRAW_ELEMENT_DBLCLICK: "draw:dblclick",
    /**
     * 绘制终止
     */
    DRAW_TERMINATE: "draw:terminate",

    // ========== 元素管理器注册元素
    /**
     * 元素增加事件
     */
    ELEMENT_REGISTER: "element:register",
    /**
     * 元素删除事件
     */
    ELEMENT_REMOVE: "element:remove"
}
