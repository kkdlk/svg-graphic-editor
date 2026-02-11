<template>
    <!--svg编辑器纸张容器-->
    <div class="svg-editor-paper-container-component">
        <div class="svg-editor-paper-container">
            <div class="svg-editor-svg-container" :id="containerID"></div>
        </div>
        <div class="svg-editor-right-container" v-if="!props.readonly">
            <svg-style-editor-component v-if="editorStatus" :svgEditor="svgEditor" :selectIdList="svgContentProvider.selectElementIds" />
        </div>
    </div>
</template>

<script setup>
import { inject, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import SVGEditor from "../../../svgeditjs/SvgEditor.js"
import EventConstant from "@/svgeditjs/constant/EventConstant.js"
import SvgStyleEditorComponent from "../svg-style-editor-component/svg-style-editor-component.vue"

const props = defineProps({
    pageId: {
        type: String,
        default: () => `container-${+new Date()}`
    },
    // 初始化svg加载事件
    initSvgLoadEvent: {
        type: Function,
        default: () => null
    },
    readonly: {
        type: Boolean,
        default: false
    }
})
const emits = defineEmits(["svg-select-change"])
const svgContentProvider = inject("svgContentProvider")
const containerID = ref(props.pageId || XeUtils.uniqueId("svg-edit-paper-"))
// 初始化
const svgEditor = new SVGEditor(containerID.value, svgContentProvider.value.config)
const editorStatus = ref(false)
// 初始化
const initEvent = () => {
    // 选中
    svgEditor.on(EventConstant.SELECT_CHANGE, (selectList) => {
        // 选中的数据变化,样式属性修改
        svgContentProvider.value.selectElementIds = selectList?.map((it) => it.id()) || []
    })
    // 绘制成功
    svgEditor.on(EventConstant.DRAW_DONE, (drawEle) => {
        // 绘制结束，当前绘制的数据选中
        svgContentProvider.value.currentSvgTool = "select"
        // 选中这个绘制的数据
        nextTick(() => {
            svgEditor.svgCoreContext.selectionHandler.addSelectElementId(drawEle.id())
        })
    })
    // 初始化svg加载事件
    const result = props.initSvgLoadEvent?.(svgEditor)
    if (result) {
        svgEditor.loadSvgString(result)
    }
}
watch(
    () => svgContentProvider.value.currentSvgTool,
    (value) => {
        if (value && svgEditor) {
            svgEditor.setTool(value)
            if (value === "fullPage") {
                setTimeout(() => {
                    svgContentProvider.value.currentSvgTool = "moveZoom"
                }, 500)
            }
        }
    }
)
watch(
    () => svgContentProvider.value.config,
    (value) => {
        if (value && svgEditor) {
            svgEditor.resetState(value)
        }
    },
    { deep: true }
)
onMounted(async () => {
    await nextTick()
    svgEditor.init()
    initEvent()
    editorStatus.value = true
})
onUnmounted(() => {
    svgEditor.destroy()
})
defineExpose({
    svgEditor
})
</script>

<style lang="scss" scoped>
.svg-editor-paper-container-component {
    flex: 1;
    display: flex;
    width: 0;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;

    .svg-editor-paper-container {
        position: relative;
        display: flex;
        flex-direction: column;
        flex: 1;
        width: 0;
        height: 100%;

        .svg-editor-svg-container {
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            overflow: hidden;
        }
    }

    .svg-editor-right-container {
        width: 300px;
        display: flex;
        flex-direction: column;
        background: #ffffff;
        // 禁用选中
        user-select: none;
    }
}
</style>
