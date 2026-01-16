<template>
	<div class="svg-style-editor-component">
		<el-form @submit.native.prevent label-width="auto" label-suffix=":" label-position="top">
			<svg-editor-paper-style-component v-show="!selectOneElementStatus" :svgEditor="svgEditor" />
			<svg-editor-element-style-component v-show="selectOneElementStatus" :svgEditor="svgEditor"
				:selectIdList="selectIdList" />
		</el-form>
	</div>
</template>

<script setup>
import { watch, ref } from "vue"
import SvgEditor from "../../SvgEditor"
import SvgEditorPaperStyleComponent from "./svg-editor-paper-style-component/svg-editor-paper-style-component.vue"
import SvgEditorElementStyleComponent from "./svg-editor-element-style-component/svg-editor-element-style-component.vue"

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
// 是否选中了一条数据
const selectOneElementStatus = ref(false)
watch(
	() => props.selectIdList,
	(newVal) => {
		if (newVal.length === 0 || newVal.length > 1) {
			selectOneElementStatus.value = false
		} else {
			selectOneElementStatus.value = true
		}
	}
)
</script>

<style lang="scss" scoped>
.svg-style-editor-component {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	background: #ffffff;
	border-left: 1px solid #e0e0e0;

	:deep(.el-form) {
		height: 100%;
	}
}
</style>
