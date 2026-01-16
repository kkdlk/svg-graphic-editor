<template>
    <!--svg编辑器，最大容器-->
    <div class="svg-editor-container-component">
        <!--svg头编辑器-->
        <svg-header-editor-component :controlList="props.controlList" />
        <!--svg内容编辑器-->
        <div class="svg-editor-container-content">
            <svg-editor-toolbar-component :readonly="props.readonly" v-model="svgContentProvider.currentSvgTool" />
            <svg-editor-paper-container-component :readonly="props.readonly" :initSvgLoadEvent="props.initSvgLoadEvent"
                ref="paperContainerRef" />
        </div>
    </div>
</template>

<script setup>
import { provide, ref, inject } from "vue"
import SvgHeaderEditorComponent from "../svg-header-editor-component/svg-header-editor-component.vue"
import SvgEditorPaperContainerComponent from "../svg-editor-paper-container-component/svg-editor-paper-container-component.vue"
import SvgEditorToolbarComponent from "../svg-editor-toolbar-component/svg-editor-toolbar-component.vue"
import { CANVAS_DEFAULT_OPTIONS } from "../../constant/BasicConfig.js"

const props = defineProps({
    // 是否只读
    readonly: {
        type: Boolean,
        default: false
    },
    // 头部工具
    controlList: {
        type: Array,
        default: () => []
    },
    // 初始化的模板数据
    initSvgLoadEvent: {
        type: Function,
        default: () => null
    },
    width: {
        type: [String, Number],
        default: "100%"
    },
    height: {
        type: [String, Number],
        default: "100%"
    },
    bgColor: {
        type: String,
        default: "#ffffff"
    },
    // 是否开启框选
    isBoxSelection: {
        type: Boolean,
        default: false
    },
    // 是否启用拖拽吸附
    isDragAdoption: {
        type: Boolean,
        default: false
    },
    // 是否启用绘制吸附
    isDrawAdoption: {
        type: Boolean,
        default: false
    },
    // 是否开启连续绘制
    enableContinuousDraw: {
        type: Boolean,
        default: true
    }
})

const svgConfig = inject(
    "svgConfig",
    ref({
        ...CANVAS_DEFAULT_OPTIONS,
        panZoomOptions: CANVAS_DEFAULT_OPTIONS.panZoomOptions,
        selectOptions: {
            ...CANVAS_DEFAULT_OPTIONS.selectOptions,
            // 是否开启框选
            isBoxSelection: props.isBoxSelection,
            // 是否启用框选吸附
            isDragAdoption: props.isDragAdoption
        },
        drawOptions: {
            ...CANVAS_DEFAULT_OPTIONS.drawOptions,
            // 是否开启绘制元素吸附到网格
            isDrawAdoption: props.isDrawAdoption,
            // 是否开启连续绘制
            enableContinuousDraw: props.enableContinuousDraw
        },
        svgWidth: props.width,
        svgHeight: props.height,
        bgColor: props.bgColor
    })
)

const svgContentProvider = ref({
    // 当前svg工具
    currentSvgTool: CANVAS_DEFAULT_OPTIONS.currentTool,
    // svg配置
    config: svgConfig.value,
    // 选中的数据ID
    selectElementIds: []
})
provide("svgContentProvider", svgContentProvider)

// 提供svg内容编辑器容器引用
const paperContainerRef = ref(null)

defineExpose({
    paperContainerRef,
    svgContentProvider,
    svgConfig
})
</script>

<style lang="scss" scoped>
.svg-editor-container-component {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #ffffff;

    .svg-editor-container-content {
        display: flex;
        flex: 1;
        height: 0;
        width: auto;
    }
}
</style>
