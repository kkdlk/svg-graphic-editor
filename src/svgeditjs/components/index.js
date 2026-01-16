import { defineAsyncComponent } from "vue"

export const SvgEditorContainerComponent = defineAsyncComponent(() => import("./svg-editor-container-component/svg-editor-container-component.vue"))
export const SvgStyleEditorComponent = defineAsyncComponent(() => import("./svg-style-editor-component/svg-style-editor-component.vue"))
