<template>
    <!-- 图纸设置 -->
    <el-card class="svg-editor-paper-style-component">
        <template #header>
            <div class="card-header">
                <span>图纸设置</span>
            </div>
        </template>
        <div class="svg-editor-paper-content">
            <!-- 图纸尺寸 -->
            <el-form-item label="图纸宽度">
                <el-input-number v-model="svgWidth" :min="1" :precision="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="图纸高度">
                <el-input-number v-model="svgHeight" :min="1" :precision="0" style="width: 100%" />
            </el-form-item>
            <!-- 背景设置 -->
            <el-form-item label="背景颜色">
                <el-color-picker v-model="bgColor" @change="(val) => updateConfig('svgBgColor', val)" show-alpha
                    size="large" />
            </el-form-item>
            <!-- 网格设置 -->
            <el-form-item label="显示网格">
                <el-switch :model-value="svgContentProvider.config.showGrid"
                    @update:model-value="(val) => updateConfig('showGrid', val)" />
            </el-form-item>
            <el-form-item label="网格大小" :disabled="!svgContentProvider.config.showGrid">
                <el-input-number v-model="svgContentProvider.config.gridSize"
                    @update:model-value="(val) => updateConfig('gridSize', val)" :min="5" :max="100" :precision="0"
                    style="width: 100%" />
            </el-form-item>
            <el-form-item label="网格颜色" :disabled="!svgContentProvider.config.showGrid">
                <el-color-picker v-model="gridColor" @change="(val) => updateConfig('gridLineColor', val)" show-alpha
                    size="large" />
            </el-form-item>
        </div>
    </el-card>
</template>

<script setup>
import { inject, computed } from "vue"
import SvgEditor from "../../../SvgEditor"

const props = defineProps({
    // 编辑器实例
    svgEditor: {
        type: SvgEditor,
        default: () => null
    }
})

const svgContentProvider = inject("svgContentProvider")

// 计算属性，处理颜色值的双向绑定
const bgColor = computed({
    get: () => svgContentProvider.value.config.svgBgColor,
    set: (val) => updateConfig("svgBgColor", val)
})
const gridColor = computed({
    get: () => svgContentProvider.value.config.gridLineColor,
    set: (val) => updateConfig("gridLineColor", val)
})
const svgWidth = computed({
    get: () => {
        let width = svgContentProvider.value.config.svgWidth
        if (typeof width === "string" && width?.includes("%")) {
            width = props.svgEditor.svgCoreContext.svgCanvas.node.clientWidth
        }
        return width
    },
    set: (val) => updateConfig("svgWidth", val)
})
const svgHeight = computed({
    get: () => {
        let height = svgContentProvider.value.config.svgHeight
        if (typeof height === "string" && height?.includes("%")) {
            height = props.svgEditor.svgCoreContext.svgCanvas.node.clientHeight
        }
        return height
    },
    set: (val) => updateConfig("svgHeight", val)
})

// 更新配置的函数
const updateConfig = (key, value) => {
    if (svgContentProvider.value && svgContentProvider.value.config) {
        svgContentProvider.value.config[key] = value
    }
}
</script>

<style lang="scss" scoped>
.svg-editor-paper-style-component {
    height: 100%;

    :deep(.svg-editor-paper-content) {
        height: 100%;
    }
}
</style>
