<template>
	<div class="svg-editor-toolbar-component">
		<div class="toolbar-section" v-for="item in toolbarToolList" :key="item.value">
			<h3 class="toolbar-title">{{ item.title }}</h3>
			<div class="toolbar-children-content">
				<template v-for="child in item.children" :key="child.value">
					<el-tooltip effect="dark" :content="`${child.title}: ${child.description}`" placement="right-end">
						<el-button :type="modelValue === child.value ? 'primary' : 'default'"
							@click="handleToolSelect(child.value)" :title="child.title" size="large">
							<template #icon>
								<svg viewBox="0 0 1024 1024" width="24" height="24" v-html="child.icon"></svg>
							</template>
						</el-button>
					</el-tooltip>
				</template>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ToolbarConfigList } from "./svg-editor-toolbar-config.js"
import { computed } from "vue"

const props = defineProps({
	// 是否只读
	readonly: {
		type: Boolean,
		default: false
	}
})
const modelValue = defineModel({
	type: String,
	default: ""
})

const handleToolSelect = (value) => {
	modelValue.value = value
}

const toolbarToolList = computed(() => {
	if (props.readonly) {
		return ToolbarConfigList.filter((item) => item.value === "baseOperations").map((item) => ({
			...item,
			children: item.children.filter((child) => child.value !== "select")
		}))
	}
	return ToolbarConfigList
})
</script>

<style lang="scss" scoped>
.svg-editor-toolbar-component {
	display: flex;
	flex-direction: column;
	padding: 0 13px 10px 10px;
	background: #ffffff;
	border-right: 1px solid #e0e0e0;
	max-height: 100%;
	overflow-y: auto;
	/*浏览器滚动条样式*/
	scrollbar-3dlight-color: #999;
	scrollbar-darkshadow-color: #999;
	scrollbar-highlight-color: #fff;
	scrollbar-shadow-color: #eee;
	scrollbar-arrow-color: #000;
	scrollbar-face-color: rgba(50, 133, 255, 0.5);
	scrollbar-track-color: #eee;
	scrollbar-base-color: #ddd;

	&::-webkit-scrollbar {
		width: 3px;
		height: 3px;
	}

	&::-webkit-scrollbar-track {
		border-radius: 0;
		background: #9d9d9d;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: 0;
		min-height: 20px;
		background-clip: content-box;
		background: transparent;
	}

	&::-webkit-scrollbar-corner {
		background: transparent;
	}

	.toolbar-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.toolbar-title {
		font-size: 15px;
		font-weight: 600;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 5px 0 5px 0;
		padding: 0;
	}

	.toolbar-children-content {
		display: flex;
		flex-direction: column;
		gap: 8px;

		.el-button+.el-button {
			margin: 0;
		}
	}
}
</style>
