<template>
    <div class="main-app">
        <SvgEditorContainerComponent />
    </div>
</template>

<script setup>
import SvgEditorContainerComponent
    from "./svgeditjs/components/svg-editor-container-component/svg-editor-container-component.vue"
</script>

<style lang="scss" scoped>
.main-app {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
}
</style>
