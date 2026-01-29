/**
 * SVG 元数据常量
 * 用于标记 SVG 元素的属性和类型
 */
export const SVG_METADATA = {
    /** 标记元素为不可选中 */
    noSelect: "no-select",
    /** 标记元素是否为闭合路径 */
    isPathClosed: "is-path-closed"
}
// 内置固定ID
export const SVG_META_BUILT_ID = {
    /** 背景元素ID */
    backgroundId: "kkdaj-background-id",
    /** 网格元素ID */
    gridId: "kkdaj-grid-id",
    /** 选择组容器ID */
    selectGroupId: "kkdaj-select-group-id",
    /** 多选框ID */
    multiSelectFrameId: "kkdaj-multi-select-frame-id",
    /** 文本编辑框ID */
    textEditId: "kkdaj-text-edit-id"
}
/**
 * SVG 绘制默认配置
 * 所有 key 均使用 SVG 标准属性名
 */
export const SvgDrawDefaultOptions = {
    // 是否开启绘制元素吸附到网格
    isDrawAdoption: false,
    // 是否开启连续绘制
    enableContinuousDraw: false,
    /** 矩形默认样式 */
    rect: {
        stroke: "#000000",
        "stroke-width": 1,
        opacity: 1,
        // 矩形填充颜色，默认透明
        fill: "transparent"
    },
    /** 圆默认样式 */
    circle: {
        stroke: "#000000",
        "stroke-width": 1,
        opacity: 1,
        // 圆填充颜色，默认透明
        fill: "transparent"
    },
    /** 椭圆默认样式 */
    ellipse: {
        stroke: "#000000",
        "stroke-width": 1,
        opacity: 1,
        // 椭圆填充颜色，默认透明
        fill: "transparent"
    },
    /** 直线默认样式 */
    line: {
        stroke: "#000000",
        "stroke-width": 1,
        opacity: 1
    },
    /** 多边形默认样式 */
    polygon: {
        stroke: "#000000",
        "stroke-width": 1,
        opacity: 1,
        // 多边形填充颜色，默认透明
        fill: "transparent"
    },
    /** 折线默认样式 */
    polyline: {
        stroke: "#000000",
        fill: "transparent",
        "stroke-width": 1,
        opacity: 1
    },
    /** 曲线默认样式 */
    bezier: {
        // 曲线填充颜色，默认无填充
        fill: "transparent",
        // 曲线描边颜色，默认黑色
        stroke: "#000000",
        // 曲线描边宽度，默认1px
        "stroke-width": 1,
        // 曲线透明度，默认1
        opacity: 1
    },
    /** 文字默认样式 */
    text: {
        // 文字描边颜色，默认黑色
        stroke: "#000000",
        "stroke-width": 1,
        // 文字填充颜色，默认黑色
        fill: "#000000",
        // 文字字体大小，默认16px
        "font-size": 16,
        // 文字字体，默认微软雅黑
        "font-family": "微软雅黑",
        // 文字对齐方式，参数有：
        // "start"：文字左对齐
        // "end"：文字右对齐
        // "middle"：文字居中对齐
        "text-anchor": "start",
        // 文字基线对齐方式，参数有：
        // "text-before-edge"：文字基线与文本框顶部对齐
        // "text-after-edge"：文字基线与文本框底部对齐
        // "middle"：文字基线与文本框中间对齐
        // "hanging"：文字基线与文本框顶部对齐，但是文字基线会低于文本框顶部
        // "alphabetic"：文字基线与文本框顶部对齐，但是文字基线会低于文本框顶部
        // "ideographic"：文字基线与文本框顶部对齐，但是文字基线会低于文本框顶部
        "dominant-baseline": "middle",
        // 文字字体粗细，默认正常，参数有："normal"、"bold"
        "font-weight": "normal",
        // 文字字体样式，默认正常，参数有："normal"、"italic"
        "font-style": "normal"
    }
}
/**
 * SVG 平移缩放默认配置
 */
export const SvgPanZoomDefaultOptions = {
    /** 是否启用平移 */
    panning: true,
    /** 是否启用双指缩放 */
    pinchZoom: true,
    /** 是否启用鼠标滚轮缩放 */
    wheelZoom: true,
    /** 平移使用的鼠标按钮 (0: 左键, 1: 中键, 2: 右键) */
    panButton: 0,
    /** 是否允许单指平移（触屏设备） */
    oneFingerPan: true,
    /** 限制平移区域的边距 {top, left, right, bottom} */
    margins: false,
    /** 滚轮缩放因子 */
    zoomFactor: 0.1,
    /** 最小缩放比例 */
    zoomMin: 0.01,
    /** 最大缩放比例 */
    zoomMax: 20,
    /** 滚轮缩放 deltaMode=1 (行) 转换到 deltaMode=0 (像素) 的乘数 */
    wheelZoomDeltaModeLinePixels: 17,
    /** 滚轮缩放 deltaMode=2 (屏幕) 转换到 deltaMode=0 (像素) 的乘数 */
    wheelZoomDeltaModeScreenPixels: 53
}

/**
 * SVG 选择器默认配置
 */
export const SvgSelectorDefaultOptions = {
    /** 是否启用框选 */
    isBoxSelection: true,
    /** 是否启用拖拽吸附 */
    isDragAdoption: false
}
/**
 * SVG 画布默认配置
 * @typedef {Object} CANVAS_DEFAULT_OPTIONS
 * @property {string} svgWidth - SVG 画布宽度
 * @property {string} svgHeight - SVG 画布高度
 * @property {string} bgColor - SVG 画布背景颜色
 * @property {boolean} showGrid - 是否显示网格
 * @property {number} gridSize - 网格大小
 * @property {string} gridLineColor - 网格线颜色
 * @property {string} currentTool - 当前工具
 * @property {boolean} panZoomStatus - 是否启用平移缩放
 * @property {Object} panZoomOptions - 平移缩放选项
 * @property {Object} selectOptions - 选择器选项
 * @property {string} activeDrawTool - 当前激活的绘图工具
 * @property {Object} drawOptions - 绘图选项
 */
export const CANVAS_DEFAULT_OPTIONS = {
    svgWidth: "100%",
    svgHeight: "100%",
    svgBgColor: "#ffffff",
    showGrid: true,
    gridSize: 20,
    gridLineColor: "#f87f7f",
    currentTool: "moveZoom",
    panZoomStatus: true,
    panZoomOptions: SvgPanZoomDefaultOptions,
    selectOptions: SvgSelectorDefaultOptions,
    activeDrawTool: "",
    drawOptions: SvgDrawDefaultOptions
}
