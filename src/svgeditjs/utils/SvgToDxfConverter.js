import DXFWriter from "dxf-writer"

/**
 * SVG 到 DXF 转换工具
 * 用于将 SVG.js 对象转换为 DXF 格式
 */
export default class SvgToDxfConverter {
    /**
     * 将 SVG.js 对象转换为 DXF 字符串
     * @param {Object} svgObject - SVG.js 对象（可以是画布或单个元素）
     * @returns {string|null} DXF 字符串，转换失败返回 null
     */
    static convert(svgObject) {
        try {
            // 创建 DXF 文档
            const dxf = new DXFWriter()
            // 设置单位（默认使用毫米）
            dxf.setUnits('Millimeters')
            // 递归处理所有元素
            this._processElement(svgObject, dxf)
            // 导出 DXF 字符串
            return dxf.toDxfString()
        } catch (error) {
            console.error('导出 DXF 失败:', error)
            return null
        }
    }

    /**
     * 递归处理 SVG.js 元素及其子元素
     * @param {Object} element - SVG.js 元素
     * @param {DXFWriter} dxf - DXFWriter 实例
     */
    static _processElement(element, dxf) {
        const elementType = element.type
        // 根据元素类型进行转换
        switch (elementType) {
            case 'svg':
            case 'g':
                // 如果是 SVG 画布或 group 元素，递归处理所有子元素
                const children = element.children()
                children.forEach(child => {
                    this._processElement(child, dxf)
                })
                break
            case 'rect':
                this._addRectToDxf(element, dxf)
                break
            case 'circle':
                this._addCircleToDxf(element, dxf)
                break
            case 'ellipse':
                this._addEllipseToDxf(element, dxf)
                break
            case 'line':
                this._addLineToDxf(element, dxf)
                break
            case 'polygon':
            case 'polyline':
                this._addPolylineToDxf(element, dxf)
                break
            case 'path':
                this._addPathToDxf(element, dxf)
                break
            case 'text':
                this._addTextToDxf(element, dxf)
                break
            default:
                console.log(`不支持的元素类型: ${elementType}`)
        }
    }

    /**
     * 将 SVG.js 矩形元素添加到 DXF
     * @param {Object} rectElement - SVG.js 矩形元素
     * @param {DXFWriter} dxf - DXFWriter 实例
     */
    static _addRectToDxf(rectElement, dxf) {
        const x = parseFloat(rectElement.attr('x')) || 0
        const y = parseFloat(rectElement.attr('y')) || 0
        const width = parseFloat(rectElement.attr('width')) || 0
        const height = parseFloat(rectElement.attr('height')) || 0
        // 应用 SVG 样式到 DXF
        this._applySvgStyle(rectElement, dxf)
        // 使用 drawRect 绘制矩形
        dxf.drawRect(x, y, x + width, y + height)
    }

    /**
     * 将 SVG.js 圆形元素添加到 DXF
     * @param {Object} circleElement - SVG.js 圆形元素
     * @param {DXFWriter} dxf - DXFWriter 实例
     */
    static _addCircleToDxf(circleElement, dxf) {
        const cx = parseFloat(circleElement.attr('cx')) || 0
        const cy = parseFloat(circleElement.attr('cy')) || 0
        const r = parseFloat(circleElement.attr('r')) || 0

        // 应用 SVG 样式到 DXF
        this._applySvgStyle(circleElement, dxf)

        // 使用 drawCircle 绘制圆形
        dxf.drawCircle(cx, cy, r)
    }

    /**
     * 将 SVG.js 椭圆元素添加到 DXF
     * @param {Object} ellipseElement - SVG.js 椭圆元素
     * @param {DXFWriter} dxf - DXFWriter 实例
     */
    static _addEllipseToDxf(ellipseElement, dxf) {
        const cx = parseFloat(ellipseElement.attr('cx')) || 0
        const cy = parseFloat(ellipseElement.attr('cy')) || 0
        const rx = parseFloat(ellipseElement.attr('rx')) || 0
        const ry = parseFloat(ellipseElement.attr('ry')) || 0

        if (rx === 0) return

        // 应用 SVG 样式到 DXF
        this._applySvgStyle(ellipseElement, dxf)

        // 使用 drawEllipse 绘制椭圆
        dxf.drawEllipse(cx, cy, rx, 0, ry / rx)
    }

    /**
     * 将 SVG.js 直线元素添加到 DXF
     * @param {Object} lineElement - SVG.js 直线元素
     * @param {DXFWriter} dxf - DXFWriter 实例
     */
    static _addLineToDxf(lineElement, dxf) {
        const x1 = parseFloat(lineElement.attr('x1')) || 0
        const y1 = parseFloat(lineElement.attr('y1')) || 0
        const x2 = parseFloat(lineElement.attr('x2')) || 0
        const y2 = parseFloat(lineElement.attr('y2')) || 0

        // 应用 SVG 样式到 DXF
        this._applySvgStyle(lineElement, dxf)

        // 使用 drawLine 绘制直线
        dxf.drawLine(x1, y1, x2, y2)
    }

    /**
     * 将 SVG.js 多边形或折线元素添加到 DXF
     * @param {Object} polyElement - SVG.js 多边形或折线元素
     * @param {DXFWriter} dxf - DXFWriter 实例
     */
    static _addPolylineToDxf(polyElement, dxf) {
        let points = []

        try {
            if (polyElement.points) {
                points = polyElement.points()
            } else if (polyElement.attr('points')) {
                const pointsString = polyElement.attr('points')
                points = this._parsePointsString(pointsString)
            }
        } catch (error) {
            console.error('获取点数据失败:', error)
            return
        }

        if (points.length < 2) return

        const dxfPoints = points.map(point => [point.x, point.y])

        const isClosed = polyElement.type === 'polygon'

        this._applySvgStyle(polyElement, dxf)

        dxf.drawPolyline(dxfPoints, isClosed)
    }

    /**
     * 将 SVG.js 路径元素添加到 DXF
     * @param {Object} pathElement - SVG.js 路径元素
     * @param {DXFWriter} dxf - DXFWriter 实例
     */
    static _addPathToDxf(pathElement, dxf) {
        const pathData = pathElement.attr('d')

        if (!pathData) return

        try {
            const commands = this._parsePathData(pathData)

            let currentX = 0
            let currentY = 0
            let lastControlX = null
            let lastControlY = null

            this._applySvgStyle(pathElement, dxf)

            commands.forEach(command => {
                const { type, params } = command

                switch (type) {
                    case 'M':
                        currentX = params[0]
                        currentY = params[1]
                        break
                    case 'L':
                        dxf.drawLine(currentX, currentY, params[0], params[1])
                        currentX = params[0]
                        currentY = params[1]
                        break
                    case 'C':
                        dxf.drawSpline([
                            [currentX, currentY],
                            [params[0], params[1]],
                            [params[2], params[3]],
                            [params[4], params[5]]
                        ])
                        currentX = params[4]
                        currentY = params[5]
                        lastControlX = params[2]
                        lastControlY = params[3]
                        break
                    case 'Z':
                        break
                }
            })
        } catch (error) {
            console.error(`解析路径失败: ${pathData}`, error)
        }
    }

    /**
     * 将 SVG.js 文本元素添加到 DXF
     * @param {Object} textElement - SVG.js 文本元素
     * @param {DXFWriter} dxf - DXFWriter 实例
     */
    static _addTextToDxf(textElement, dxf) {
        const x = parseFloat(textElement.attr('x')) || 0
        const y = parseFloat(textElement.attr('y')) || 0
        const text = textElement.text()
        const fontSize = parseFloat(textElement.attr('font-size')) || 16
        const rotation = 0

        this._applySvgStyle(textElement, dxf)

        dxf.drawText(x, y, fontSize, rotation, text)
    }

    /**
     * 解析SVG点字符串为坐标数组
     * @param {string} pointsString - SVG点字符串（如"10,20 30,40 50,60"）
     * @returns {Array} 坐标对象数组（如[{x: 10, y: 20}, {x: 30, y: 40}]）
     */
    static _parsePointsString(pointsString) {
        if (!pointsString) return []

        const pointsArray = pointsString.trim().split(/\s+/)

        return pointsArray.map(pointStr => {
            const coords = pointStr.split(',')
            return { x: parseFloat(coords[0]), y: parseFloat(coords[1]) }
        }).filter(point => !isNaN(point.x) && !isNaN(point.y))
    }

    /**
     * 解析SVG路径数据
     * @param {string} pathData - SVG路径数据字符串
     * @returns {Array} 命令对象数组
     */
    static _parsePathData(pathData) {
        if (!pathData) return []

        pathData = pathData.trim().replace(/\s+/g, ' ')

        const commandRegex = /([MmLlHhVvCcSsQqTtAaZz])/g
        const paramRegex = /[-+]?[\d]*\.?[\d]+(?:[eE][-+]?\d+)?/g

        const commands = []
        let lastIndex = 0
        let match

        while ((match = commandRegex.exec(pathData)) !== null) {
            const paramsStr = pathData.slice(lastIndex, match.index).trim()
            if (paramsStr && commands.length > 0) {
                const params = paramsStr.match(paramRegex).map(parseFloat)
                commands[commands.length - 1].params = params
            }
            commands.push({ type: match[0], params: [] })
            lastIndex = commandRegex.lastIndex
        }

        const lastParamsStr = pathData.slice(lastIndex).trim()
        if (lastParamsStr && commands.length > 0) {
            const params = lastParamsStr.match(paramRegex).map(parseFloat)
            commands[commands.length - 1].params = params
        }

        return commands
    }

    /**
     * 解析SVG样式并应用到DXF文档
     * @param {Object} svgElement - SVG.js 元素
     * @param {DXFWriter} dxf - DXFWriter 实例
     */
    static _applySvgStyle(svgElement, dxf) {
        const fill = svgElement.attr('fill')
        const stroke = svgElement.attr('stroke')
        const strokeWidth = svgElement.attr('stroke-width')
        const strokeDasharray = svgElement.attr('stroke-dasharray')

        const convertColorToAci = (color) => {
            if (!color || color === 'none') return null
            const aciColorMap = {
                'red': DXFWriter.ACI.RED,
                'green': DXFWriter.ACI.GREEN,
                'blue': DXFWriter.ACI.BLUE,
                'yellow': DXFWriter.ACI.YELLOW,
                'cyan': DXFWriter.ACI.CYAN,
                'magenta': DXFWriter.ACI.MAGENTA,
                'white': DXFWriter.ACI.WHITE,
                'black': DXFWriter.ACI.BLACK,
                'gray': 7, // 7是白色，这里使用白色作为灰色的近似
                'orange': 202,
                'purple': 180,
                'brown': 131,
                'pink': 217,
                'lime': DXFWriter.ACI.GREEN
            }

            const colorName = color.toLowerCase()
            return aciColorMap[colorName] || DXFWriter.ACI.WHITE
        }

        const getLineType = () => {
            if (!strokeDasharray) return 'CONTINUOUS'
            if (strokeDasharray.includes(',')) return 'DASHED'
            if (parseInt(strokeDasharray) > 0) return 'DOTTED'
            return 'CONTINUOUS'
        }

        const strokeColor = convertColorToAci(stroke)
        const fillColor = convertColorToAci(fill)
        const lineType = getLineType()

        const colorToUse = strokeColor || fillColor || DXFWriter.ACI.WHITE

        let layerName
        if (stroke) {
            layerName = `layer_${lineType}_${strokeColor || DXFWriter.ACI.WHITE}`
        } else if (fill) {
            layerName = `layer_fill_${fillColor || DXFWriter.ACI.WHITE}`
        } else {
            layerName = '0' // 默认图层
        }
        if (!dxf.layers || !dxf.layers[layerName]) {
            dxf.addLayer(layerName, colorToUse, lineType)
        }
        dxf.setActiveLayer(layerName)
        return {
            strokeWidth: strokeWidth ? parseFloat(strokeWidth) : 0,
            strokeColor: strokeColor,
            fillColor: fillColor,
            lineType: lineType
        }
    }
}
