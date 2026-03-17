import {
    Colors,
    HatchPattern,
    HatchPolyline,
    LineTypes,
    LWPolylineFlags,
    point,
    point2d,
    TextHorizontalJustification,
    TextVerticalJustification,
    TrueColor,
    Units,
    Writer
} from "@tarikjabiri/dxf/lib"
import ColorUtil from "./ColorUtil.js"
import { dashArray } from "../constant/SvgConstant.js"
import FillPattern from "../constant/FillPatternConfig.js"

/**
 * 使用 @tarikjabiri/dxf 实现的 SVG 转 DXF 工具
 * @author kkdlk
 * @date 2026-03-17
 */
export default class SvgToDxfConverter {
    /**
     * @param {Object} svgCanvas - SVG.js 的画布对象 (draw)
     * @param {Object} options - { flipY: true }
     */
    static convert(svgCanvas, options = {}) {
        const writer = new Writer()
        // 1. 模型空间和表
        const document = writer.document
        const modelSpace = document.modelSpace
        const tables = document.tables
        // 2. 设置单位 (根据 DXF 标准，6 代表美制，4 代表毫米)
        document.setUnits(Units.Millimeters)
        document.addVariable("$LASTSAVEDBY", { 1: "xianyuntu" })
        document.addVariable("$HANDSEED", { 5: "100D2" })
        // 3. 获取画布信息
        const viewbox = svgCanvas.viewbox()
        const height = viewbox.height || 1000
        const flipY = options.flipY !== false
        // 4. 构建参数
        const ctx = { writer, modelSpace, tables, document, height, flipY, colorLayerMap: new Map() }
        // 5. 设置全局配置
        tables.addStyle({ name: "Chinese_Font", primaryfontFileName: "gbenor.shx", bigFontFileName: "gbcbig.shx", italic: false, bold: false })
        // 2. 线类型定义
        dashArray
            .filter((dashItem) => dashItem.lineType !== "Continuous")
            .map((dashItem) => {
                tables.addLType({ name: dashItem.lineType, descriptive: dashItem.label, elements: dashItem.lineTypeArr })
            })
        // 3. 开始递归处理
        this._iterate(svgCanvas, ctx)
        return writer.stringify()
    }

    static _iterate(element, ctx) {
        if (!element || typeof element.children !== "function") {
            return
        }
        element.children().forEach((child) => {
            const type = child.type
            // 处理坐标变换 (含矩阵)
            const transformCoord = (x, y) => {
                const m = child.transform()
                const nx = x * (m.a ?? 1) + y * (m.c ?? 0) + (m.e ?? 0)
                const ny = x * (m.b ?? 0) + y * (m.d ?? 1) + (m.f ?? 0)
                return point2d(nx, ctx.flipY ? ctx.height - ny : ny)
            }
            switch (type) {
                case "g":
                case "svg": {
                    this._iterate(child, ctx)
                    break
                }
                case "rect": {
                    this._handleRect(child, transformCoord, ctx)
                    break
                }
                case "circle": {
                    this._handleCircle(child, transformCoord, ctx)
                    break
                }
                case "ellipse": {
                    this._handleEllipse(child, transformCoord, ctx)
                    break
                }
                case "line": {
                    this._handleLine(child, transformCoord, ctx)
                    break
                }
                case "polyline":
                case "polygon": {
                    this._handlePolygon(child, transformCoord, ctx, type)
                    break
                }
                case "path": {
                    this._handlePath(child, transformCoord, ctx)
                    break
                }
                case "text": {
                    this._handleText(child, transformCoord, ctx)
                    break
                }
                default:
                    console.log(`不支持的元素类型：${type}`)
            }
        })
    }
    /**
     * 处理椭圆
     * @param child
     * @param transformCoord
     * @param ctx
     * @private
     */
    static _handleEllipse(child, transformCoord, ctx) {
        const strokeColor = child.attr("stroke")
        // 颜色
        this._generateLayerName(ctx, strokeColor)
        // 提取旋转角度（如果有）
        let rotation = 0
        const transform = child.attr("transform")
        if (transform) {
            // 简单解析旋转，实际中可能需要完整解析transform矩阵
            const match = transform.match(/rotate\(([-\d.]+)(?:\s*,\s*([-\d.]+)\s*,\s*([-\d.]+))?\)/)
            if (match) {
                rotation = (parseFloat(match[1]) * Math.PI) / 180 // 角度转弧度
            }
        }
        // 线条类型
        const strokeDashArray = child.attr("stroke-dasharray")
        const strokeWidth = child.attr("stroke-width")
        // 构造线型与样式选项
        const options = {}
        // 处理虚线样式 (Linetype)
        if (strokeDashArray && strokeDashArray !== "none") {
            const itemData = dashArray.find((itemDash) => itemDash.value === strokeDashArray)
            if (itemData) {
                // 注意：你必须先在 ctx.document.tables 中使用 addLType 定义过 "DASHED"
                options.lineTypeName = itemData.lineType
                options.lineTypeScale = 1.0 // 根据需要调整比例
            }
        }
        // 处理全局线宽
        if (strokeWidth) {
            options.lineWeight = (parseFloat(strokeWidth) || 1) * 100
        }
        const ellipseData = this._formatEllipseData(child, transformCoord, rotation)
        if (!ellipseData || !ellipseData.center || !ellipseData.majorAxisOffset || ellipseData.ratio === void 0) {
            return
        }
        //  只有当有描边颜色且非透明时才添加边框
        if (strokeColor && strokeColor !== "none" && strokeColor !== "transparent") {
            // 参数依次为：中心点，主轴相对偏移，比例，起始弧度，结束弧度
            ctx.modelSpace.addEllipse({ center: ellipseData.center, endpoint: ellipseData.majorAxisOffset, ratio: ellipseData.ratio, ...options })
        }
        // 填充
        this._addHatchFill(child, transformCoord, ctx)
    }
    /**
     * 处理SVG椭圆数据，转换为DXF椭圆参数
     * @param {Object} child - SVG椭圆元素
     * @param {Function} transformCoord - 坐标转换函数
     * @param {number} [rotation=0] - 椭圆旋转角度（弧度），可选
     * @returns {{center: *, majorAxisOffset: {x: number, y: number}, ratio: number}|undefined}
     * @private
     */
    static _formatEllipseData(child, transformCoord, rotation = 0) {
        const cx = parseFloat(child.attr("cx")) || 0
        const cy = parseFloat(child.attr("cy")) || 0
        const rx = parseFloat(child.attr("rx")) || 0
        const ry = parseFloat(child.attr("ry")) || 0
        // 有效性检查
        if (rx <= 0 || ry <= 0) {
            console.warn(`Invalid ellipse radii: rx=${rx}, ry=${ry}`)
            return
        }
        // 1. 获取中心点的转换后坐标
        const center = transformCoord(cx, cy)
        // 2. 确定主轴和次轴
        let majorRadius, minorRadius
        let isRxMajor

        if (rx >= ry) {
            majorRadius = rx
            minorRadius = ry
            isRxMajor = true
        } else {
            majorRadius = ry
            minorRadius = rx
            isRxMajor = false
        }

        // 3. 计算比例 (必须 <= 1)
        const ratio = minorRadius / majorRadius

        // 4. 计算主轴偏移向量，考虑旋转角度
        let majorAxisOffset

        if (isRxMajor) {
            // 主轴沿X轴方向
            majorAxisOffset = {
                x: majorRadius * Math.cos(rotation),
                y: majorRadius * Math.sin(rotation)
            }
        } else {
            // 主轴沿Y轴方向，需要考虑SVG坐标系Y轴向下
            // 在DXF中，Y轴向上，所以需要调整符号
            majorAxisOffset = {
                x: -majorRadius * Math.sin(rotation), // 注意负号
                y: majorRadius * Math.cos(rotation)
            }
        }

        // 5. 考虑坐标系翻转（如果transformCoord未处理）
        // 假设transformCoord已经处理了Y轴翻转
        // 如果没有，可以在这里处理：
        // majorAxisOffset.y = -majorAxisOffset.y

        // 返回DXF椭圆参数
        return {
            center,
            majorAxisOffset: point2d(majorAxisOffset.x, majorAxisOffset.y),
            ratio
        }
    }

    /**
     * 处理文本
     * @param child
     * @param transformCoord
     * @param ctx
     * @private
     */
    static _handlePath(child, transformCoord, ctx) {
        const d = child.attr("d")
        if (!d) {
            return
        }
        const strokeColor = child.attr("stroke")
        // 线条类型
        const strokeDashArray = child.attr("stroke-dasharray")
        const strokeWidth = child.attr("stroke-width")
        // 构造线型与样式选项
        const options = {}
        // 处理虚线样式 (Linetype)
        if (strokeDashArray && strokeDashArray !== "none") {
            const itemData = dashArray.find((itemDash) => itemDash.value === strokeDashArray)
            if (itemData) {
                // 注意：你必须先在 ctx.document.tables 中使用 addLType 定义过 "DASHED"
                options.lineTypeName = itemData.lineType
                options.lineTypeScale = 1.0 // 根据需要调整比例
            }
        }
        // 处理全局线宽
        if (strokeWidth) {
            options.lineWeight = (parseFloat(strokeWidth) || 1) * 100
        }
        // 颜色
        this._generateLayerName(ctx, strokeColor)
        const commands = d.match(/[a-df-z][^a-df-z]*/gi) || []
        let cur = { x: 0, y: 0 }
        let start = { x: 0, y: 0 } // 用于平滑曲线 S 指令（可选扩展）
        commands.forEach((cmdStr) => {
            const type = cmdStr[0]
            const args = cmdStr
                .slice(1)
                .trim()
                .split(/[\s,]+|(?=-)/)
                .filter((v) => v !== "")
                .map(parseFloat)

            const isRel = type === type.toLowerCase()
            const cmd = type.toUpperCase()

            switch (cmd) {
                case "M":
                    cur.x = (isRel ? cur.x : 0) + args[0]
                    cur.y = (isRel ? cur.y : 0) + args[1]
                    start = { ...cur }
                    break

                case "L":
                    for (let i = 0; i < args.length; i += 2) {
                        const next = {
                            x: (isRel ? cur.x : 0) + args[i],
                            y: (isRel ? cur.y : 0) + args[i + 1]
                        }
                        ctx.modelSpace.addLine({ start: transformCoord(cur.x, cur.y), end: transformCoord(next.x, next.y), ...options })
                        cur = next
                    }
                    break

                case "H":
                    args.forEach((v) => {
                        const next = { x: (isRel ? cur.x : 0) + v, y: cur.y }
                        ctx.modelSpace.addLine({ start: transformCoord(cur.x, cur.y), end: transformCoord(next.x, next.y), ...options })
                        cur = next
                    })
                    break

                case "V":
                    args.forEach((v) => {
                        const next = { x: cur.x, y: (isRel ? cur.y : 0) + v }
                        ctx.modelSpace.addLine({ start: transformCoord(cur.x, cur.y), end: transformCoord(next.x, next.y), ...options })
                        cur = next
                    })
                    break

                case "C": // 三次贝塞尔曲线
                    for (let i = 0; i < args.length; i += 6) {
                        const cp1 = {
                            x: (isRel ? cur.x : 0) + args[i],
                            y: (isRel ? cur.y : 0) + args[i + 1]
                        }
                        const cp2 = {
                            x: (isRel ? cur.x : 0) + args[i + 2],
                            y: (isRel ? cur.y : 0) + args[i + 3]
                        }
                        const end = {
                            x: (isRel ? cur.x : 0) + args[i + 4],
                            y: (isRel ? cur.y : 0) + args[i + 5]
                        }

                        // 将贝塞尔曲线的 4 个点转换为 DXF Spline 的控制点
                        // 转换函数 transformFn 返回的是 point2d，addSpline 接受 point2d/point3d 数组
                        ctx.modelSpace.addSpline({
                            controls: [
                                transformCoord(cur.x, cur.y),
                                transformCoord(cp1.x, cp1.y),
                                transformCoord(cp2.x, cp2.y),
                                transformCoord(end.x, end.y)
                            ],
                            degree: 3, // 显式指定为三次曲线
                            ...options
                        })

                        cur = end
                    }
                    break

                case "Q": // 二次贝塞尔曲线 (可选扩展)
                    for (let i = 0; i < args.length; i += 4) {
                        const cp = {
                            x: (isRel ? cur.x : 0) + args[i],
                            y: (isRel ? cur.y : 0) + args[i + 1]
                        }
                        const end = {
                            x: (isRel ? cur.x : 0) + args[i + 2],
                            y: (isRel ? cur.y : 0) + args[i + 3]
                        }
                        ctx.modelSpace.addSpline({
                            controls: [transformCoord(cur.x, cur.y), transformCoord(cp.x, cp.y), transformCoord(end.x, end.y)],
                            degree: 2, // 二次曲线
                            ...options
                        })
                        cur = end
                    }
                    break

                case "Z":
                    ctx.modelSpace.addLine({
                        start: transformCoord(cur.x, cur.y),
                        end: transformCoord(start.x, start.y),
                        ...options
                    })
                    cur = { ...start }
                    break
                default:
                    console.warn(`未处理的路径指令: ${cmd}`)
            }
        })
        // 填充
        this._addHatchFill(child, transformCoord, ctx)
    }

    /**
     * 处理线条
     * @param child
     * @param transformCoord
     * @param ctx
     * @private
     */
    static _handleLine(child, transformCoord, ctx) {
        const strokeColor = child.attr("stroke")
        // 线条类型
        const strokeDashArray = child.attr("stroke-dasharray")
        const strokeWidth = child.attr("stroke-width")
        // 构造线型与样式选项
        const options = {}
        // 处理虚线样式 (Linetype)
        if (strokeDashArray && strokeDashArray !== "none") {
            const itemData = dashArray.find((itemDash) => itemDash.value === strokeDashArray)
            if (itemData) {
                // 注意：你必须先在 ctx.document.tables 中使用 addLType 定义过 "DASHED"
                options.lineTypeName = itemData.lineType
                options.lineTypeScale = 1.0 // 根据需要调整比例
            }
        }
        // 处理全局线宽
        if (strokeWidth) {
            options.lineWeight = (parseFloat(strokeWidth) || 1) * 100
        }
        // 颜色
        this._generateLayerName(ctx, strokeColor)
        //  只有当有描边颜色且非透明时才添加边框
        if (strokeColor && strokeColor !== "none" && strokeColor !== "transparent") {
            ctx.modelSpace.addLine({
                start: transformCoord(child.attr("x1"), child.attr("y1")),
                end: transformCoord(child.attr("x2"), child.attr("y2")),
                ...options
            })
        }
    }
    /**
     * 处理圆形
     * @param child
     * @param transformCoord
     * @param ctx
     * @private
     */
    static _handleCircle(child, transformCoord, ctx) {
        const strokeColor = child.attr("stroke")
        const circleX = child.attr("cx")
        const circleY = child.attr("cy")
        // 半径
        const radius = parseFloat(child.attr("r")) || 0
        // 线条类型
        const strokeDashArray = child.attr("stroke-dasharray")
        const strokeWidth = child.attr("stroke-width")
        const cp = transformCoord(circleX, circleY)
        if (!radius || radius <= 0) {
            return
        }
        // 图层生成（颜色绑定）
        this._generateLayerName(ctx, strokeColor)
        // 3. 构造线型与样式选项
        const options = {}
        // 4. 处理虚线样式 (Linetype)
        if (strokeDashArray && strokeDashArray !== "none") {
            const itemData = dashArray.find((itemDash) => itemDash.value === strokeDashArray)
            if (itemData) {
                // 注意：你必须先在 ctx.document.tables 中使用 addLType 定义过 "DASHED"
                options.lineTypeName = itemData.lineType
                options.lineTypeScale = 1.0 // 根据需要调整比例
            }
        }
        // 5. 处理全局线宽
        if (strokeWidth) {
            options.lineWeight = (parseFloat(strokeWidth) || 1) * 100
        }
        // 6. 只有当有描边颜色且非透明时才添加边框
        if (strokeColor && strokeColor !== "none" && strokeColor !== "transparent") {
            // 颜色
            ctx.modelSpace.addCircle({
                center: cp,
                radius,
                ...options
            })
        }
        // 填充
        this._addHatchFill(child, transformCoord, ctx)
    }

    /**
     * 处理矩形
     * @param child
     * @param transformCoord
     * @param ctx
     * @private
     */
    static _handleRect(child, transformCoord, ctx) {
        const strokeColor = child.attr("stroke")
        // 线条类型
        const strokeDashArray = child.attr("stroke-dasharray")
        const strokeWidth = child.attr("stroke-width")
        // 图层生成（颜色绑定）
        this._generateLayerName(ctx, strokeColor)
        // 2. 格式化坐标
        const lineCoord = this._formatRectData(child, transformCoord)
        // 3. 构造线型与样式选项
        const options = { flags: LWPolylineFlags.Closed }
        // 4. 处理虚线样式 (Linetype)
        if (strokeDashArray && strokeDashArray !== "none") {
            const itemData = dashArray.find((itemDash) => itemDash.value === strokeDashArray)
            if (itemData) {
                // 注意：你必须先在 ctx.document.tables 中使用 addLType 定义过 "DASHED"
                options.lineTypeName = itemData.lineType
                options.lineTypeScale = 1.0 // 根据需要调整比例
            }
        }
        // 5. 处理全局线宽
        if (strokeWidth) {
            options.lineWeight = (parseFloat(strokeWidth) || 1) * 100
        }
        // 6. 只有当有描边颜色且非透明时才添加边框
        if (strokeColor && strokeColor !== "none" && strokeColor !== "transparent") {
            ctx.modelSpace.addLWPolyline({ vertices: lineCoord, ...options })
        }
        // 填充
        this._addHatchFill(child, transformCoord, ctx)
    }

    /**
     * 格式化矩形数据
     * @param child
     * @param transformCoord
     * @returns {{lineCoord: *[]}}
     * @private
     */
    static _formatRectData(child, transformCoord) {
        const rx = parseFloat(child.attr("x")) || 0
        const ry = parseFloat(child.attr("y")) || 0
        const rw = parseFloat(child.attr("width")) || 0
        const rh = parseFloat(child.attr("height")) || 0
        return [transformCoord(rx, ry), transformCoord(rx + rw, ry), transformCoord(rx + rw, ry + rh), transformCoord(rx, ry + rh)]
    }

    /**
     * 处理多边形
     * @param child
     * @param transformCoord
     * @param ctx
     * @param type
     * @private
     */
    static _handlePolygon(child, transformCoord, ctx, type) {
        const strokeColor = child.attr("stroke")
        // 线条类型
        const strokeDashArray = child.attr("stroke-dasharray")
        const strokeWidth = child.attr("stroke-width")
        // 构造线型与样式选项
        const options = { flags: type === "polygon" ? LWPolylineFlags.Closed : LWPolylineFlags.None }
        // 处理虚线样式 (Linetype)
        if (strokeDashArray && strokeDashArray !== "none") {
            const itemData = dashArray.find((itemDash) => itemDash.value === strokeDashArray)
            if (itemData) {
                // 注意：你必须先在 ctx.document.tables 中使用 addLType 定义过 "DASHED"
                options.lineTypeName = itemData.lineType
                options.lineTypeScale = 1.0 // 根据需要调整比例
            }
        }
        // 处理全局线宽
        if (strokeWidth) {
            options.lineWeight = (parseFloat(strokeWidth) || 1) * 100
        }
        // 颜色
        this._generateLayerName(ctx, strokeColor)
        //  只有当有描边颜色且非透明时才添加边框
        if (strokeColor && strokeColor !== "none" && strokeColor !== "transparent") {
            const pts = child.array().map((p) => transformCoord(p[0], p[1]))
            ctx.modelSpace.addLWPolyline({ vertices: pts, ...options })
        }
        // 填充
        this._addHatchFill(child, transformCoord, ctx)
    }
    /**
     * 处理路径
     * @param child
     * @param transformCoord
     * @param ctx
     * @private
     */
    static _handleText(child, transformCoord, ctx) {
        const textContent = child.text() // 获取文本内容
        if (!textContent) {
            return
        }
        const x = parseFloat(child.attr("x")) || 0
        const y = parseFloat(child.attr("y")) || 0
        const fontSize = parseFloat(child.attr("font-size")) || 12
        // 1. 坐标转换 (包含矩阵变换和 Y 轴翻转)
        const pos = transformCoord(x, y)
        // 2. 解析 SVG 对齐方式并映射到 DXF
        // SVG 默认 text-anchor: start | middle | end
        const anchor = child.attr("text-anchor") || "start"
        let hAlign = TextHorizontalJustification.Left
        if (anchor === "middle") {
            hAlign = TextHorizontalJustification.Center
        }
        if (anchor === "end") {
            hAlign = TextHorizontalJustification.Right
        }
        const options = {
            rotation: 0, // 如果 SVG 有旋转，矩阵变换已处理位置，此处通常设为 0
            horizontalJustification: hAlign,
            verticalJustification: TextVerticalJustification.BaseLine, // 匹配 SVG 默认基线对齐
            // 对于 Left 以外的对齐方式，必须提供第二对齐点
            secondAlignmentPoint: pos
        }
        // 3. 添加文本实体
        ctx.modelSpace.addText({
            firstAlignmentPoint: pos,
            value: textContent,
            height: fontSize,
            styleName: "Chinese_Font",
            ...options
        })
    }

    /**
     * web颜色格式化为CAD颜色代码
     * @param color
     * @returns {number}
     * @private
     */
    static _colorFormat(color) {
        // 16进制颜色，rgb,rgba 颜色转为CAD的颜色代码
        const normalizedColor = color.trim().toLowerCase()
        let colorTrueValue = TrueColor.fromHex("#000000")
        if (normalizedColor.startsWith("#")) {
            colorTrueValue = TrueColor.fromHex(color)
        } else if (normalizedColor.startsWith("rgb")) {
            const rgbaValue = ColorUtil.rgbaStringToRgbaValues(color)
            colorTrueValue = TrueColor.fromRGB(rgbaValue.r, rgbaValue.g, rgbaValue.b)
        }
        return colorTrueValue
    }

    /**
     * 图层设置和颜色配置
     * @param ctx
     * @param color
     * @param layerName
     * @private
     */
    static _generateLayerName(ctx, color, layerName = "") {
        if (!color || color === "none" || color === "transparent") {
            ctx.document.setCurrentLayerName("0")
            return
        }
        const colorLayerMap = ctx.colorLayerMap
        // 颜色格式化
        const colorTrueValue = this._colorFormat(color)
        const colorLayerKey = `layer_${colorTrueValue}`
        let layerItem = null
        if (colorLayerMap.has(colorLayerKey)) {
            layerItem = colorLayerMap.get(colorLayerKey)
        } else {
            const tempObj = { color: colorTrueValue, layerName: `${layerName}${layerName ? "-" : "layer-"}${colorTrueValue}` }
            colorLayerMap.set(colorLayerKey, tempObj)
            layerItem = tempObj
        }
        if (layerItem && !ctx.tables.layer.get(layerItem.layerName)) {
            ctx.tables.addLayer({
                name: layerItem.layerName,
                colorNumber: Colors.Black,
                trueColor: layerItem.color,
                lineTypeName: LineTypes.Continuous
            })
        }
        ctx.document.setCurrentLayerName(layerItem.layerName)
    }

    /**
     * 填充填充
     * @param child 当前数据
     * @param transformCoord 坐标转换
     * @param ctx 上下文 包含 writer tables modelSpace
     * @private
     */
    static _addHatchFill(child, transformCoord, ctx) {
        const fillAttr = child.attr("fill")
        const normalizedColor = (fillAttr || "").trim().toLowerCase()
        // 1. 颜色与透明度校验
        let rgbaValue = null
        if (normalizedColor.startsWith("#")) {
            rgbaValue = ColorUtil.hexToRgbValues(fillAttr)
        } else if (normalizedColor.startsWith("rgb")) {
            rgbaValue = ColorUtil.rgbaStringToRgbaValues(fillAttr)
        }
        if (!fillAttr || fillAttr === "none" || fillAttr === "transparent" || (rgbaValue && rgbaValue.a <= 0)) {
            return
        }
        // 2. 准备填充定义 (Pattern/Gradient)
        let cross
        if (fillAttr.startsWith("url")) {
            const patternItem = FillPattern.find((fillItem) => `url(#${fillItem.id})` === fillAttr)
            if (patternItem) {
                // 如果是自定义 Pattern
                cross = new HatchPattern({
                    name: patternItem.patternType
                })
                patternItem.patternCallback?.(cross)
            }
        }
        // 默认兜底：SOLID 填充
        if (!cross) {
            cross = new HatchPattern({ name: "SOLID" })
        }

        // 3. 在 modelSpace 中创建 Hatch 实体
        const hatch = ctx.modelSpace.addHatch({
            fill: cross
        })
        // 如果是纯色且不是 URL 模式，设置 trueColor
        if (!fillAttr.startsWith("url")) {
            hatch.trueColor = this._colorFormat(fillAttr)
        }
        // 从填充对象中获取边界容器
        const boundary = hatch.add()
        const type = child.type
        switch (type) {
            case "rect": {
                const lineCoord = this._formatRectData(child, transformCoord)
                const hatchPolyline = new HatchPolyline({ isClosed: true })
                lineCoord.forEach((p) => {
                    hatchPolyline.add(point(p.x, p.y))
                })
                boundary.polyline(hatchPolyline)
                break
            }
            case "circle": {
                const cx = parseFloat(child.attr("cx")) || 0
                const cy = parseFloat(child.attr("cy")) || 0
                const radius = parseFloat(child.attr("r")) || 0
                if (radius <= 0) {
                    return
                }
                // 新版 API 示例中虽有 boundary.arc，但对于闭合圆，
                // 沿用 Polyline 采样法是最稳定的兼容方案
                const hatchPolyline = new HatchPolyline({ isClosed: true })
                const segments = 72
                for (let i = 0; i < segments; i++) {
                    const angle = (i * 2 * Math.PI) / segments
                    const p = transformCoord(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle))
                    hatchPolyline.add(point(p.x, p.y))
                }
                boundary.polyline(hatchPolyline)
                break
            }
            case "ellipse": {
                const cx = parseFloat(child.attr("cx")) || 0
                const cy = parseFloat(child.attr("cy")) || 0
                const rx = parseFloat(child.attr("rx")) || 0
                const ry = parseFloat(child.attr("ry")) || 0
                if (rx <= 0 || ry <= 0) {
                    return
                }

                const hatchPolyline = new HatchPolyline({ isClosed: true })
                const numSegments = 72
                for (let i = 0; i < numSegments; i++) {
                    const theta = (i * 2 * Math.PI) / numSegments
                    const p = transformCoord(cx + rx * Math.cos(theta), cy + ry * Math.sin(theta))
                    hatchPolyline.add(point(p.x, p.y))
                }
                boundary.polyline(hatchPolyline)
                break
            }
            case "polygon": {
                const rawPoints = child.array()
                const hatchPolyline = new HatchPolyline({ isClosed: true })
                rawPoints.forEach((p) => {
                    const tp = transformCoord(p[0], p[1])
                    hatchPolyline.add(point(tp.x, tp.y))
                })
                boundary.polyline(hatchPolyline)
                break
            }
            case "path": {
                const d = child.attr("d")
                // 只有包含闭合指令 Z/z 的路径才进行填充处理
                if (!d || (!d.includes("Z") && !d.includes("z"))) {
                    return
                }
                const hatchPolyline = new HatchPolyline({ isClosed: true })
                // 使用正则拆解指令和参数
                const commands = d.match(/[a-df-z][^a-df-z]*/gi) || []
                let cur = { x: 0, y: 0 } // 当前点
                let startPoint = { x: 0, y: 0 } // 路径起始点（用于 Z 指令闭合）
                /**
                 * 三次贝塞尔曲线公式函数
                 */
                const _getBezierPoint = (t, p0, p1, p2, p3) => {
                    const invT = 1 - t
                    return {
                        x: Math.pow(invT, 3) * p0.x + 3 * Math.pow(invT, 2) * t * p1.x + 3 * invT * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x,
                        y: Math.pow(invT, 3) * p0.y + 3 * Math.pow(invT, 2) * t * p1.y + 3 * invT * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y
                    }
                }
                commands.forEach((cmdStr) => {
                    const type = cmdStr[0]
                    const cmd = type.toUpperCase()
                    const isRel = type === type.toLowerCase() // 是否为相对坐标指令
                    const args = cmdStr
                        .slice(1)
                        .trim()
                        .split(/[\s,]+|(?=-)/)
                        .filter((v) => v !== "")
                        .map(parseFloat)

                    switch (cmd) {
                        case "M": {
                            // MoveTo
                            for (let i = 0; i < args.length; i += 2) {
                                cur.x = (isRel ? cur.x : 0) + args[i]
                                cur.y = (isRel ? cur.y : 0) + args[i + 1]
                                if (i === 0) {
                                    startPoint = { ...cur }
                                } // 记录子路径起点
                                const p = transformCoord(cur.x, cur.y)
                                hatchPolyline.add(point(p.x, p.y, 0))
                            }
                            break
                        }

                        case "L": {
                            // LineTo
                            for (let i = 0; i < args.length; i += 2) {
                                cur.x = (isRel ? cur.x : 0) + args[i]
                                cur.y = (isRel ? cur.y : 0) + args[i + 1]
                                const p = transformCoord(cur.x, cur.y)
                                hatchPolyline.add(point(p.x, p.y, 0))
                            }
                            break
                        }

                        case "H": {
                            // Horizontal Line
                            args.forEach((v) => {
                                cur.x = (isRel ? cur.x : 0) + v
                                const p = transformCoord(cur.x, cur.y)
                                hatchPolyline.add(point(p.x, p.y, 0))
                            })
                            break
                        }

                        case "V": {
                            // Vertical Line
                            args.forEach((v) => {
                                cur.y = (isRel ? cur.y : 0) + v
                                const p = transformCoord(cur.x, cur.y)
                                hatchPolyline.add(point(p.x, p.y, 0))
                            })
                            break
                        }

                        case "C": {
                            // Cubic Bezier
                            for (let i = 0; i < args.length; i += 6) {
                                const p0 = { ...cur }
                                const p1 = { x: (isRel ? cur.x : 0) + args[i], y: (isRel ? cur.y : 0) + args[i + 1] }
                                const p2 = { x: (isRel ? cur.x : 0) + args[i + 2], y: (isRel ? cur.y : 0) + args[i + 3] }
                                const p3 = { x: (isRel ? cur.x : 0) + args[i + 4], y: (isRel ? cur.y : 0) + args[i + 5] }

                                const steps = 16 // 采样步数
                                for (let t = 1; t <= steps; t++) {
                                    const pt = _getBezierPoint(t / steps, p0, p1, p2, p3)
                                    const p = transformCoord(pt.x, pt.y)
                                    hatchPolyline.add(point(p.x, p.y, 0))
                                }
                                cur = { ...p3 }
                            }
                            break
                        }

                        case "Z": {
                            // ClosePath
                            cur = { ...startPoint }
                            const p = transformCoord(cur.x, cur.y)
                            hatchPolyline.add(point(p.x, p.y, 0))
                            break
                        }
                        default: {
                            // 忽略其他指令
                        }
                    }
                })
                // 关键：只有当边界点数足以构成闭合区域（>=3个点）时才添加，确保组码 91 不为 0
                if (hatchPolyline.vertices.length >= 3) {
                    boundary.polyline(hatchPolyline)
                } else {
                    // 如果没有有效边界，移除这个 hatch
                    // 注意：取决于你的库是否有 remove 方法，或者在这里 return 之前不创建 hatch
                }
                break
            }
            default: {
                return
            }
        }
    }
}
