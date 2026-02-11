const patternModules = import.meta.glob("../expand/*.svg", { eager: true, query: "?raw", import: "default" })
export default [
    { id: "fill-pattern-1", label: "编织纹理", value: patternModules["../expand/编织纹理.svg"] },
    { id: "fill-pattern-2", label: "点状纹理", value: patternModules["../expand/点状纹理.svg"] },
    { id: "fill-pattern-3", label: "交叉线纹理", value: patternModules["../expand/交叉线纹理.svg"] },
    { id: "fill-pattern-4", label: "网格纹理", value: patternModules["../expand/网格纹理.svg"] },
    { id: "fill-pattern-5", label: "细密网格纹理", value: patternModules["../expand/细密网格纹理.svg"] },
    { id: "fill-pattern-6", label: "斜线纹理", value: patternModules["../expand/斜线纹理.svg"] }
]
