<template>
    <div class="svg-header-editor-component">
        <div class="svg-header-editor-title">
            <div class="svg-header-editor-title-logo">
                <img src="/favicon.ico" alt="" />
            </div>
            <div class="svg-header-editor-title-content">{{ props.title }}</div>
        </div>
        <div class="svg-header-editor-control">
            <div class="svg-header-editor-control-item" v-for="item in svgHeaderControlList" :key="item.value">
                <el-tooltip effect="dark" :content="`${item.title}: ${item.details}`" placement="bottom">
                    <el-button @click="item.clickEvent?.()">
                        <div v-html="item.icon"></div>
                    </el-button>
                </el-tooltip>
            </div>
        </div>
        <div class="svg-header-editor-menus"></div>
    </div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
    controlList: {
        type: Array,
        default: () => []
    },
    title: {
        type: String,
        default: "SVG编辑器"
    }
})
// 控制项列表
const svgHeaderControlList = computed(() => {
    return props.controlList
})
</script>

<style lang="scss" scoped>
.svg-header-editor-component {
    height: 55px;
    border-bottom: 1px solid #e5e5e5;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;

    .svg-header-editor-title {
        display: flex;
        height: 100%;
        align-items: center;

        .svg-header-editor-title-logo {
            height: 100%;
            display: flex;
            align-items: center;

            img {
                height: 40px;
            }
        }

        .svg-header-editor-title-content {
            font-size: 20px;
            font-weight: bold;
            color: #333333;
            margin-left: 10px;
        }
    }

    .svg-header-editor-control {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;

        .svg-header-editor-control-item {
            &:nth-child(n + 2) {
                margin-left: 10px;
            }
        }
    }
}
</style>
