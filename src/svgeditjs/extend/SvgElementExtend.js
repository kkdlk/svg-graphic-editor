import "@svgdotjs/svg.draggable.js"
import { applyBoundaryConstraints, applyGridSnap } from "../utils/SnapUtils"

/**
 * SVG 元素扩展方法
 */

export default {
    /**
     * 元素拖拽
     * @param _svgCanvas 图纸，用来获取范围
     * @param enable 开启或关闭拖拽
     */
    drag(_svgCanvas, enable = true) {
        this.draggable(enable)
        // 创建一个临时元素作为幽灵追随
        let ghostShape = null
        if (enable) {
            const constraintsBox = _svgCanvas.bbox()
            this.on("dragstart", () => {
                ghostShape = _svgCanvas.put(this.clone().opacity(0.2))
            })
            this.on("dragmove.namespace", (e) => {
                e.preventDefault()
                const { handler, box } = e.detail
                let { x, y } = box
                ;[x, y] = applyBoundaryConstraints(x, y, box, constraintsBox)
                const isDragAdoption = this._editorState.getState("selectOptions.isDragAdoption")
                if (isDragAdoption) {
                    // 获取网格大小
                    const gridSize = this._editorState.getState("gridSize")
                    ;[x, y] = applyGridSnap(x, y, box, constraintsBox, gridSize)
                    handler.move(x, y)
                    // handler.move(box.x - (box.x % this._editorState.getState("gridSize")), box.y - (box.y % this._editorState.getState("gridSize")))
                } else {
                    handler.move(x, y)
                }
                ghostShape?.animate(300, ">").move(x, y)
            })
            this.on("dragend", () => {
                ghostShape.remove()
            })
        } else {
            this.off("dragmove.namespace")
        }
        return this
    },
    /**
     * 判断路径是否闭合
     * @param {SVGElement} pathElement - 路径元素
     * @returns {boolean}
     */
    isPathClosed() {
        if (this.node.nodeName.toLowerCase() !== "path") return false
        const pathArray = this.array()
        let startPoint = null
        let endPoint = null
        for (let i = 0; i < pathArray.length; i++) {
            const command = pathArray[i]
            if (Array.isArray(command) && (command[0] === "Z" || command[0] === "z")) {
                return true
            }
            if (command === "Z") {
                return true
            }
            if (Array.isArray(command)) {
                const cmd = command[0]
                if (cmd === "M" || cmd === "m") {
                    if (startPoint === null) {
                        startPoint = { x: command[1], y: command[2] }
                    }
                }
                if (command.length >= 3) {
                    endPoint = { x: command[command.length - 2], y: command[command.length - 1] }
                }
            }
        }
        if (startPoint && endPoint) {
            return Math.abs(startPoint.x - endPoint.x) < 0.01 && Math.abs(startPoint.y - endPoint.y) < 0.01
        }
        return false
    }
}
