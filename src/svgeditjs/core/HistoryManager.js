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
        // 快照映射 (用于记录变更前的状态)
        this._snapshotMap = new Map()
        // 最大历史记录步数
        this._maxHistory = 50
        // 是否正在执行撤销重做操作
        this._isUndoRedo = false
        // 批量更新定时器
        this._batchTimer = null
        // 待记录的元素ID集合
        this._pendingElementIds = new Set()
        // 防抖延迟 (ms)
        this._debounceDelay = 100

        // 键盘事件处理函数引用 (用于解绑)
        this._handleKeyDown = this._handleKeyDown.bind(this)
        // 绑定事件
        this._bindEvents()
    }
    /**
     * 绑定事件
     */
    _bindEvents() {
        // 位置和形状更新 (批量)
        this._eventBus.on(EventConstant.ELEMENT_FORMAT_DATA, (elementIds) => {
            if (this._isUndoRedo) return
            const ids = Array.isArray(elementIds) ? elementIds : [elementIds]
            this._handleBatchUpdate(ids)
        })

        // 样式更新 (单个或数组)
        this._eventBus.on(EventConstant.ELEMENT_UPDATE_DATA, (elementIds) => {
            if (this._isUndoRedo) return
            const ids = Array.isArray(elementIds) ? elementIds : [elementIds]
            this._handleBatchUpdate(ids)
        })

        // 新增
        this._eventBus.on(EventConstant.ELEMENT_REGISTER, (elementId) => {
            if (this._isUndoRedo) return
            // 新增元素时，需要立即记录初始快照
            this._updateSnapshot(elementId)
            // 新增操作单独记录，不走批量更新的防抖，或者作为一次单独的 action
            // 这里为了简单，如果用户连续添加，可以考虑是否合并，但通常添加是离散操作。
            // 暂时不放入 batchUpdate，避免和后续的 move 混淆，或者也可以放入。
            // 现在的逻辑是：Register 只是记录 Snapshot，不记录 UndoStack？
            // 原有逻辑：this._handleBatchUpdate([elementId])
            // 通常 Register 本身应该是一个 History Item (Add Element)，但这里之前的代码似乎是把 Register 当作一次 Update？
            // 如果我们把 Register 仅仅当做 Snapshot 初始化。
            // 真正的 "Add" 动作历史记录通常在 UI 交互层触发，或者这里我们需要区分 Type。
            // 鉴于之前的代码逻辑：
            // this._handleBatchUpdate([elementId])
            // 这意味着 "Initial State" -> "Initial State" ? 这不会产生 diff。
            // 除非 _snapshotMap 在 Register 之前是空的。
            // 让我们保持原有的 snapshot 逻辑，但优化 update。
            this._updateSnapshot(elementId)
        })

        // 删除
        this._eventBus.on(EventConstant.ELEMENT_REMOVE, (elementId) => {
            if (this._isUndoRedo) return
            // 删除操作目前不支持撤销 (基于原有代码分析)，但需要清理 snapshot
            this._snapshotMap.delete(elementId)
            this._pendingElementIds.delete(elementId)
        })

        // 画布变化
        this._svgCanvasStatusSubscription = this._editorState.subscribe(
            ["svgWidth", "svgHeight", "svgBgColor", "showGrid", "gridSize", "gridLineColor"],
            (svgWidth, svgHeight, svgBgColor, showGrid, gridSize, gridLineColor) => {}
        )
        // 绑定键盘快捷键
        window.addEventListener("keydown", this._handleKeyDown)
    }

    /**
     * 处理键盘事件
     */
    _handleKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            const key = e.key.toLowerCase()
            if (key === "z") {
                e.preventDefault()
                if (e.shiftKey) {
                    this.redo()
                } else {
                    this.undo()
                }
            } else if (key === "y") {
                e.preventDefault()
                this.redo()
            }
        }
    }

    /**
     * 处理批量更新 (带防抖)
     * @param {Array<string>} elementIds - 元素ID数组
     */
    _handleBatchUpdate(elementIds) {
        // 1. 确保所有涉及的元素都有初始快照
        for (const elementId of elementIds) {
            // 如果是首次遇到（或者 snapshot 被删除了），先记录一下当前状态作为“过去”的状态
            // 但注意：此时元素可能已经被 ElementManager 更新了。
            // 理想情况下，Snapshot 应该在修改 *之前* 建立。
            // 假如 ElementManager 在 emit 事件之前修改了数据，那么这里获取的 snapshot 已经是新数据了。
            // 这会导致 prevData === nextData，无法记录历史。
            // *修正假设*：EventConstant.ELEMENT_REGISTER 已经保证了初始 Snapshot 存在。
            // 只有当 Snapshot 不存在时才补录（防止报错），但可能已经晚了。
            if (!this._snapshotMap.has(elementId)) {
                this._updateSnapshot(elementId)
            }
            this._pendingElementIds.add(elementId)
        }

        // 2. 重置防抖定时器
        if (this._batchTimer) {
            clearTimeout(this._batchTimer)
        }

        this._batchTimer = setTimeout(() => {
            this._recordBatchHistory()
            this._batchTimer = null
        }, this._debounceDelay)
    }

    /**
     * 获取元素当前状态快照
     * @param {string} id
     */
    _getSnapshot(id) {
        const elementData = this._elementManager.getElementData(id)
        if (!elementData) return null
        // 深拷贝，防止引用被修改
        return {
            ...elementData,
            metadata: { ...elementData.metadata },
            style: { ...elementData.style }
        }
    }

    /**
     * 更新快照
     * @param {string} id
     */
    _updateSnapshot(id) {
        const snapshot = this._getSnapshot(id)
        if (snapshot) {
            this._snapshotMap.set(id, snapshot)
        }
    }

    /**
     * 记录批量历史
     */
    _recordBatchHistory() {
        if (this._pendingElementIds.size === 0) return

        const changes = []

        for (const id of this._pendingElementIds) {
            const currentData = this._getSnapshot(id)
            if (!currentData) continue // 元素可能已被删除

            const prevData = this._snapshotMap.get(id)

            // 如果没有前置状态，或者状态未发生实质变化，则跳过
            // 简单比较：JSON stringify 或者 深度比较。这里为了性能和简化，假设走了 _handleBatchUpdate 就是有变化。
            // 但为了精确，最好比对一下关键属性。目前主要依靠 ElementManager 的事件触发机制。
            // 为了防止“无变化”的操作污染历史栈（例如点击了一下但没动），应该做比对。
            if (!prevData) {
                // 补录 snapshot，但不计入 Undo (因为没有 prev)
                this._snapshotMap.set(id, currentData)
                continue
            }

            // 比较 prevData 和 currentData
            // 暂时简化：只要触发了就记录。后续可优化 Deep Diff。

            changes.push({
                id: id,
                prev: prevData,
                next: currentData
            })

            // 更新快照为最新状态，以便下一次变更基于此状态
            this._snapshotMap.set(id, currentData)
        }

        this._pendingElementIds.clear()

        if (changes.length === 0) return

        // 推入撤销栈
        this._undoStack.push({
            type: "batch_update",
            changes: changes,
            timestamp: Date.now()
        })

        // 限制栈大小
        if (this._undoStack.length > this._maxHistory) {
            this._undoStack.shift()
        }

        // 清空重做栈 (新的操作会打断 Undo/Redo 链)
        this._redoStack = []

        console.log(`[History] Recorded batch update with ${changes.length} elements. Stack size: ${this._undoStack.length}`)
    }

    /**
     * 撤销
     */
    undo() {
        if (this._undoStack.length === 0) return
        this._isUndoRedo = true

        const batchAction = this._undoStack.pop()
        console.log("[History] Undo:", batchAction)

        try {
            if (batchAction.type === "batch_update") {
                // 记录对应的 Redo 操作
                // Undo 是即时的，不需要防抖

                // 1. 恢复状态
                batchAction.changes.forEach((change) => {
                    this._elementManager.updateElementData(change.id, change.prev)
                    // 恢复后，快照也要回滚，否则下一次变更对比会出错
                    // 注意：updateElementData 可能会触发事件，但我们有 _isUndoRedo 锁住，不会触发 _handleBatchUpdate
                    this._updateSnapshot(change.id)
                })

                // 2. 推入 Redo 栈
                this._redoStack.push(batchAction)
            }
        } catch (e) {
            console.error("Undo failed", e)
        } finally {
            this._isUndoRedo = false
        }
    }

    /**
     * 重做
     */
    redo() {
        if (this._redoStack.length === 0) return
        this._isUndoRedo = true

        const batchAction = this._redoStack.pop()
        console.log("[History] Redo:", batchAction)

        try {
            if (batchAction.type === "batch_update") {
                // 1. 恢复状态 (to next)
                batchAction.changes.forEach((change) => {
                    this._elementManager.updateElementData(change.id, change.next)
                    this._updateSnapshot(change.id)
                })

                // 2. 推入 Undo 栈
                this._undoStack.push(batchAction)
            }
        } catch (e) {
            console.error("Redo failed", e)
        } finally {
            this._isUndoRedo = false
        }
    } /**
     * 防抖函数
     * @param {Function} fn Function to debounce
     * @param {number} delay Delay in ms
     */
    _debounce(fn, delay) {
        let timer = null
        return function (...args) {
            const context = this
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                fn.apply(context, args)
            }, delay)
        }
    }

    destroy() {}
}
