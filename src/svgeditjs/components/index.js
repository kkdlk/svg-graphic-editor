import { defineAsyncComponent } from "vue"

export const SvgEditorContainerComponent = defineAsyncComponent(() => import("./svg-editor-container-component/svg-editor-container-component.vue"))
export const SvgEditorPaperContainerComponent = defineAsyncComponent(() => import("./svg-editor-paper-container-component/svg-editor-paper-container-component.vue"))
export const SvgEditorToolbarComponent = defineAsyncComponent(() => import("./svg-editor-toolbar-component/svg-editor-toolbar-component.vue"))
export const SvgHeaderEditorComponent = defineAsyncComponent(() => import("./svg-header-editor-component/svg-header-editor-component.vue"))
export const SvgStyleEditorComponent = defineAsyncComponent(() => import("./svg-style-editor-component/svg-style-editor-component.vue"))
export const SvgEditorElementStyleEditorComponent = defineAsyncComponent(() => import("./svg-style-editor-component/svg-editor-element-style-component/svg-editor-element-style-component.vue"))
export const SvgEditorPaperStyleComponent = defineAsyncComponent(() => import("./svg-style-editor-component/svg-editor-paper-style-component/svg-editor-paper-style-component.vue"))
