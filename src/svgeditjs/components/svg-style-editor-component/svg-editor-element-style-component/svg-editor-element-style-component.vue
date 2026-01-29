<template>
    <!-- 元素设置 -->
    <el-card class="svg-editor-element-style-component">
        <template #header>
            <div class="card-header">
                <span>元素样式</span>
            </div>
        </template>
        <div class="svg-editor-element-style-content">
            <el-form-item label="X坐标">
                <el-input-number v-model="positionX" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Y坐标">
                <el-input-number v-model="positionY" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="角度">
                <el-input-number v-model="rotate" :min="-180" :max="180" :precision="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="透明度">
                <el-input-number v-model="opacity" :precision="1" :min="0.1" :max="1.0" :step="0.1"
                    style="width: 100%" />
            </el-form-item>
            <template v-if="['rect', 'circle', 'ellipse', 'polygon'].includes(selectElement?.type) || isPathClosed">
                <el-form-item label="填充颜色" label-position="left">
                    <el-color-picker show-alpha v-model="fill" size="large" @clear="() => (fill = 'transparent')" />
                </el-form-item>
                <el-form-item label="填充纹理" label-position="left">
                    <el-select v-model="fillTexture" placeholder="请选择纹理">
                        <el-option v-for="item in textureList" :key="item.id" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
            </template>
            <template v-if="!['text'].includes(selectElement?.type)">
                <el-form-item label="边框颜色" label-position="left">
                    <el-color-picker show-alpha v-model="stroke" size="large" @clear="() => (stroke = 'transparent')" />
                </el-form-item>
                <el-form-item label="边框宽度" label-position="left">
                    <el-input-number v-model="strokeWidth" :min="0" :precision="0" style="width: 100%" />
                </el-form-item>
                <el-form-item label="边框样式" label-position="left">
                    <el-select v-model="strokeDasharray" placeholder="请选择边框样式">
                        <el-option label="实线" value="none" />
                        <el-option label="虚线" value="5 5" />
                        <el-option label="点线" value="10 10" />
                        <el-option label="点虚线" value="10 5" />
                        <el-option label="点点线" value="10 10 5 10" />
                    </el-select>
                </el-form-item>
            </template>
            <template v-if="['text'].includes(selectElement?.type)">
                <el-form-item label="文本内容" label-position="left">
                    <el-input v-model="textContent" style="width: 100%" />
                </el-form-item>
                <el-form-item label="字体" label-position="left">
                    <el-select v-model="fontFamily" placeholder="请选择字体">
                        <el-option v-for="item in fontFamilyList" :key="item.id" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="字体大小" label-position="left">
                    <el-input-number v-model="fontSize" :min="0" :precision="0" style="width: 100%" />
                </el-form-item>
                <el-form-item label="字体颜色" label-position="left">
                    <el-color-picker show-alpha :model-value="stroke" size="large" @change="
                        (val) => {
                            stroke = val
                            fill = val
                        }
                    " @clear="() => (stroke = '#000000')" />
                </el-form-item>
                <el-form-item label="字体粗细" label-position="left">
                    <el-select v-model="fontWeight" placeholder="请选择字体粗细">
                        <el-option label="正常" value="normal" />
                        <el-option label="加粗" value="bold" />
                    </el-select>
                </el-form-item>
                <el-form-item label="字体样式" label-position="left">
                    <el-select v-model="fontStyle" placeholder="请选择字体样式">
                        <el-option label="正常" value="normal" />
                        <el-option label="斜体" value="italic" />
                    </el-select>
                </el-form-item>
            </template>
            <el-form-item>
                <el-button style="width: 100%" @click="deleteElement" type="danger">删除</el-button>
            </el-form-item>
        </div>
    </el-card>
</template>

<script setup>
import SvgEditor from "../../../SvgEditor"
import EventConstant from "@/svgeditjs/constant/EventConstant.js"
import { SVG_METADATA } from "@/svgeditjs/constant/BasicConfig.js"
import { computed, watch, ref, onUnmounted } from "vue"
import { ElMessageBox } from "element-plus"

const props = defineProps({
    // 编辑器实例
    svgEditor: {
        type: SvgEditor,
        default: () => null
    },
    // 选中的数据ID
    selectIdList: {
        type: Array,
        default: () => []
    }
})
// 当前选中的元素信息
const selectElement = ref(null)

// 辅助函数：获取当前选中的元素ID
const getCurrentElementId = () => props.selectIdList[0] || null

// 辅助函数：更新元素数据
const updateElementData = (path, value) => {
    const elementId = getCurrentElementId()
    if (!elementId || !props.svgEditor?.svgCoreContext?.elementManager) return

    let updateData = {}
    if (path.includes(".")) {
        const [parent, child] = path.split(".")
        updateData[parent] = { [child]: value }
    } else {
        updateData.style = { [path]: value }
    }

    props.svgEditor.svgCoreContext.elementManager.updateElementData(elementId, updateData)
}

// 辅助函数：创建计算属性（用于metadata）
const createMetadataComputed = (key, defaultValue = 0) => {
    return computed({
        get: () => selectElement.value?.metadata?.[key] || defaultValue,
        set: (val) => updateElementData(`metadata.${key}`, val)
    })
}

// 辅助函数：创建计算属性（用于style）
const createStyleComputed = (key, defaultValue = null) => {
    return computed({
        get: () => selectElement.value?.style?.[key] || defaultValue,
        set: (val) => updateElementData(key, val)
    })
}

const textureList = computed(() => {
    if (!props.svgEditor?.svgCoreContext) return []
    return props.svgEditor.svgCoreContext.getPatternNames()
})

// 位置和旋转属性
const positionX = createMetadataComputed("x", 0)
const positionY = createMetadataComputed("y", 0)
const rotate = createMetadataComputed("rotate", 0)
// 基础样式属性
const opacity = createStyleComputed("opacity", 1)
// 是否是闭合曲线
const isPathClosed = computed(() => {
    if (!selectElement.value) return false
    return selectElement.value?.metadata?.[SVG_METADATA.isPathClosed] ?? false
})
// 填充相关属性
const fill = computed({
    get: () => {
        const fillValue = selectElement.value?.style?.fill
        if (!fillValue) return null
        return fillValue.startsWith("url") ? null : fillValue
    },
    set: (val) => updateElementData("fill", val)
})

const fillTexture = computed({
    get: () => {
        const fillValue = selectElement.value?.style?.fill
        if (!fillValue) return ""
        return fillValue.startsWith("url") ? fillValue : ""
    },
    set: (val) => updateElementData("fill", val)
})

// 边框相关属性
const stroke = computed({
    get: () => selectElement.value?.style?.stroke || "transparent",
    set: (val) => updateElementData("stroke", val)
})

const strokeWidth = createStyleComputed("stroke-width", 1)
const strokeDasharray = createStyleComputed("stroke-dasharray", "none")

// 文本相关属性
const textContent = createStyleComputed("text", "")
const fontSize = createStyleComputed("font-size", 16)
const fontFamily = createStyleComputed("font-family", "sans-serif")
const fontWeight = createStyleComputed("font-weight", "normal")
const fontStyle = createStyleComputed("font-style", "normal")

const fontFamilyList = ref([
    { id: "1", label: "微软雅黑", value: "Microsoft YaHei" },
    { id: "2", label: "宋体", value: "SimSun" },
    { id: "3", label: "楷体", value: "KaiTi" },
    { id: "4", label: "隶书", value: "LiSu" },
    { id: "5", label: "黑体", value: "SimHei" }
])

// 监听元素数据变化的事件处理函数
const handleElementDataChange = () => {
    if (!props.svgEditor?.svgCoreContext?.elementManager || props.selectIdList.length !== 1) return

    const elementData = props.svgEditor.svgCoreContext.elementManager.getElementData(props.selectIdList[0])
    if (elementData) {
        selectElement.value = { ...elementData }
    }
}

// 监听选中数据切换
watch(
    () => props.selectIdList,
    (newVal) => {
        if (!newVal || newVal.length !== 1) {
            selectElement.value = null
            return
        }

        if (!props.svgEditor?.svgCoreContext?.elementManager) return

        const elementData = props.svgEditor.svgCoreContext.elementManager.getElementData(newVal[0])
        selectElement.value = elementData || null
    },
    { immediate: true }
)

// 注册事件监听
let eventListener = null
if (props.svgEditor) {
    eventListener = props.svgEditor.on([EventConstant.ELEMENT_FORMAT_DATA, EventConstant.ELEMENT_UPDATE_DATA], handleElementDataChange)
}
const deleteElement = () => {
    // 删除
    ElMessageBox.confirm(`是否删除已选择的${props.selectIdList.length}条数据`, "删除选中图层").then(() => {
        props.selectIdList.forEach((id) => {
            props.svgEditor.svgCoreContext.elementManager.removeElement(id)
            props.svgEditor.svgCoreContext.selectionHandler.clearSelectElement()
        })
    })
}
// 清理事件监听
onUnmounted(() => {
    if (props.svgEditor && eventListener) {
        props.svgEditor.off(eventListener)
    }
})
</script>

<style lang="scss" scoped>
.svg-editor-element-style-component {
    height: 100%;

    :deep(.svg-editor-element-style-content) {
        height: 100%;
    }
}
</style>
