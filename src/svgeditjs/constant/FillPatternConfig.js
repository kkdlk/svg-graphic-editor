import { point2d } from "@tarikjabiri/dxf/lib"

const patternModules = import.meta.glob("../expand/*.svg", { eager: true, query: "?raw", import: "default" })
export default [
    {
        id: "fill-pattern-1",
        label: "麦芒垂坠纹",
        value: patternModules["../expand/maimangchuizhuiwen.svg"],
        patternType: "GRASS",
        patternCallback: (grass) => {
            const patternScale = 5
            grass.add({
                angle: 90,
                base: point2d(),
                offset: point2d(0.707106781 * patternScale, 0.707106781 * patternScale),
                dashLengths: [0.1875 * patternScale, -1.226713563 * patternScale]
            })
            grass.add({
                angle: 45,
                base: point2d(),
                offset: point2d(0, 1 * patternScale),
                dashLengths: [0.1875 * patternScale, -0.8125 * patternScale]
            })
            grass.add({
                angle: 135,
                base: point2d(),
                offset: point2d(0, 1 * patternScale),
                dashLengths: [0.1875 * patternScale, -0.8125 * patternScale]
            })
        }
    },
    {
        id: "fill-pattern-2",
        label: "斜十字纹",
        value: patternModules["../expand/xieshiziwen.svg"],
        patternType: "CROSS",
        patternCallback: (cross) => {
            const patternScale = 20
            cross.add({
                angle: 45,
                base: point2d(0, 0),
                offset: point2d(0, 0.25 * Math.sqrt(2) * patternScale),
                dashLengths: [0.125 * patternScale, -0.375 * patternScale]
            })
            cross.add({
                angle: 135,
                base: point2d(0.0625 * Math.sqrt(2) * patternScale, 0),
                offset: point2d(0, 0.25 * Math.sqrt(2) * patternScale),
                dashLengths: [0.125 * patternScale, -0.375 * patternScale]
            })
            return cross
        }
    },
    {
        id: "fill-pattern-3",
        label: "稀疏竖条格栅纹",
        value: patternModules["../expand/xishushutiaogeshan.svg"],
        patternType: "ANSI31",
        patternCallback: (cross) => {
            const patternScale = 10
            cross.add({
                angle: 90,
                base: point2d(),
                offset: point2d(0.25 * patternScale, 0),
                dashLengths: []
            })
        }
    },
    {
        id: "fill-pattern-4",
        label: "十字星纹",
        value: patternModules["../expand/shizixingwen.svg"],
        patternType: "CROSS",
        patternCallback: (cross) => {
            const patternScale = 20
            cross.add({
                angle: 0,
                base: point2d(),
                offset: point2d(0.25 * patternScale, 0.25 * patternScale),
                dashLengths: [0.125 * patternScale, -0.375 * patternScale]
            })
            cross.add({
                angle: 90,
                base: point2d(0.0625 * patternScale, -0.0625 * patternScale),
                offset: point2d(0.25 * patternScale, 0.25 * patternScale),
                dashLengths: [0.125 * patternScale, -0.375 * patternScale]
            })
        }
    },
    {
        id: "fill-pattern-5",
        label: "斜向拼格纹",
        value: patternModules["../expand/xiexiangpingewen.svg"],
        patternType: "AR-HBONE",
        patternCallback: (cross) => {
            const patternScale = 1
            cross.add({
                angle: 45,
                base: point2d(),
                offset: point2d(0, 4 * patternScale),
                dashLengths: [12 * patternScale, -4 * patternScale]
            })
            cross.add({
                angle: 135,
                base: point2d(2.828427125 * patternScale, 2.828427125 * patternScale),
                offset: point2d(4 * patternScale, 0),
                dashLengths: [12 * patternScale, -4 * patternScale]
            })
        }
    },
    {
        id: "fill-pattern-6",
        label: "致密竖条格栅纹",
        value: patternModules["../expand/zhimishutiaogeshanwen.svg"],
        patternType: "ANSI32",
        patternCallback: (cross) => {
            const patternScale = 5
            cross.add({
                angle: 90,
                base: point2d(),
                offset: point2d(0.25 * patternScale, 0),
                dashLengths: []
            })
        }
    },
    {
        id: "fill-pattern-7",
        label: "密致斜线纹",
        value: patternModules["../expand/zhimixiexianwen.svg"],
        patternType: "ANSI33",
        patternCallback: (cross) => {
            const patternScale = 10
            cross.add({
                angle: -45,
                base: point2d(),
                offset: point2d(0.2 * patternScale, 0),
                dashLengths: []
            })
            cross.add({
                angle: -45,
                base: point2d(0, 0),
                offset: point2d(0.1 * patternScale, 0),
                dashLengths: [0.1 * patternScale, -0.1 * patternScale]
            })
        }
    },
    {
        id: "fill-pattern-8",
        label: "斜条星点纹",
        value: patternModules["../expand/xietiaoxingdianwen.svg"],
        patternType: "SACNCR",
        patternCallback: (cross) => {
            const patternScale = 20
            cross.add({
                angle: 45,
                base: point2d(0, 0),
                offset: point2d(0, 0.25 * Math.sqrt(2) * patternScale),
                dashLengths: [0.125 * patternScale, -0.375 * patternScale]
            })
            cross.add({
                angle: 135,
                base: point2d(0.0625 * Math.sqrt(2) * patternScale, 0),
                offset: point2d(0, 0.25 * Math.sqrt(2) * patternScale),
                dashLengths: [0.125 * patternScale, -0.375 * patternScale]
            })
            cross.add({
                angle: 45,
                base: point2d(0, 0),
                offset: point2d(0, 0.1975 * Math.sqrt(2) * patternScale),
                dashLengths: []
            })
        }
    },
    {
        id: "fill-pattern-9",
        label: "层叠横栅纹",
        value: patternModules["../expand/cengdiehengshanwen.svg"],
        patternType: "DASH",
        patternCallback: (cross) => {
            const patternScale = 10
            cross.add({
                angle: 0,
                base: point2d(0, 0),
                offset: point2d(0.25 * patternScale, 0.25 * patternScale),
                dashLengths: [0.25 * patternScale, -0.25 * patternScale]
            })
        }
    },
    {
        id: "fill-pattern-10",
        label: "素点纹",
        value: patternModules["../expand/sudianwen.svg"],
        patternType: "DOTS",
        patternCallback: (cross) => {
            const patternScale = 10
            cross.add({
                angle: 0,
                base: point2d(0, 0),
                offset: point2d(0.03 * patternScale, 0.06 * patternScale),
                dashLengths: [0, -0.06 * patternScale]
            })
        }
    },
    {
        id: "fill-pattern-11",
        label: "多面格纹",
        value: patternModules["../expand/duomiangewen.svg"],
        patternType: "GRAVEL",
        patternCallback: (cross) => {
            const patternScale = 20
            // 主石子层 - 多种方向和大小的虚线，模拟石子间的接缝
            cross.add({
                angle: 0,
                base: point2d(),
                offset: point2d(0.8 * patternScale, 0.6 * patternScale),
                dashLengths: [0.3 * patternScale, -0.5 * patternScale, 0.2 * patternScale, -0.6 * patternScale]
            })
            cross.add({
                angle: 45,
                base: point2d(0.2 * patternScale, 0.1 * patternScale),
                offset: point2d(0.7 * patternScale, 0.9 * patternScale),
                dashLengths: [0.4 * patternScale, -0.7 * patternScale, 0.3 * patternScale, -0.8 * patternScale]
            })
            cross.add({
                angle: 90,
                base: point2d(0.15 * patternScale, -0.05 * patternScale),
                offset: point2d(0.9 * patternScale, 0.5 * patternScale),
                dashLengths: [0.25 * patternScale, -0.65 * patternScale, 0.35 * patternScale, -0.55 * patternScale]
            })
            cross.add({
                angle: 135,
                base: point2d(-0.1 * patternScale, 0.2 * patternScale),
                offset: point2d(0.6 * patternScale, 0.7 * patternScale),
                dashLengths: [0.5 * patternScale, -0.4 * patternScale, 0.1 * patternScale, -0.9 * patternScale]
            })
            cross.add({
                angle: 30,
                base: point2d(0.3 * patternScale, 0.25 * patternScale),
                offset: point2d(0.85 * patternScale, 0.75 * patternScale),
                dashLengths: [0.35 * patternScale, -0.5 * patternScale, 0.15 * patternScale, -1.0 * patternScale]
            })
            cross.add({
                angle: 60,
                base: point2d(0.1 * patternScale, 0.4 * patternScale),
                offset: point2d(1.2 * patternScale, 0.8 * patternScale),
                dashLengths: [0.2 * patternScale, -0.9 * patternScale, 0.4 * patternScale, -0.8 * patternScale]
            })
            cross.add({
                angle: 120,
                base: point2d(0.4 * patternScale, -0.1 * patternScale),
                offset: point2d(0.7 * patternScale, 1.1 * patternScale),
                dashLengths: [0.45 * patternScale, -0.6 * patternScale, 0.25 * patternScale, -0.85 * patternScale]
            })
            cross.add({
                angle: 150,
                base: point2d(-0.2 * patternScale, 0.3 * patternScale),
                offset: point2d(0.9 * patternScale, 0.65 * patternScale),
                dashLengths: [0.15 * patternScale, -0.75 * patternScale, 0.5 * patternScale, -0.4 * patternScale]
            })
            // 增加一些更短的线段，模拟小石子
            cross.add({
                angle: 10,
                base: point2d(0.5 * patternScale, 0.15 * patternScale),
                offset: point2d(0.4 * patternScale, 0.3 * patternScale),
                dashLengths: [0.1 * patternScale, -0.3 * patternScale, 0.05 * patternScale, -0.25 * patternScale]
            })
            cross.add({
                angle: 80,
                base: point2d(0.2 * patternScale, 0.5 * patternScale),
                offset: point2d(0.5 * patternScale, 0.4 * patternScale),
                dashLengths: [0.15 * patternScale, -0.35 * patternScale, 0.1 * patternScale, -0.4 * patternScale]
            })
            cross.add({
                angle: 100,
                base: point2d(0.7 * patternScale, 0.2 * patternScale),
                offset: point2d(0.3 * patternScale, 0.5 * patternScale),
                dashLengths: [
                    0.2 * patternScale,
                    -0.1 * patternScale,
                    0.1 * patternScale,
                    -0.2 * patternScale,
                    0.15 * patternScale,
                    -0.25 * patternScale
                ]
            })
            cross.add({
                angle: 170,
                base: point2d(-0.3 * patternScale, 0.6 * patternScale),
                offset: point2d(0.6 * patternScale, 0.4 * patternScale),
                dashLengths: [0.12 * patternScale, -0.28 * patternScale, 0.08 * patternScale, -0.32 * patternScale]
            })
        }
    },
    {
        id: "fill-pattern-12",
        label: "三角星点纹",
        value: patternModules["../expand/sanjiaoxingdianwen.svg"],
        patternType: "AR_CONC",
        patternCallback: (cross) => {
            const patternScale = 5
            cross.add({
                angle: 50,
                base: point2d(0, 0),
                offset: point2d(4.12975034 * patternScale, -5.89789472 * patternScale),
                dashLengths: [0.75 * patternScale, -8.25 * patternScale]
            })
            cross.add({
                angle: 355,
                base: point2d(0, 0),
                offset: point2d(-2.03781207 * patternScale, 7.3723684 * patternScale),
                dashLengths: [0.6 * patternScale, -6.6 * patternScale]
            })
            cross.add({
                angle: 100.45144446,
                base: point2d(0.59771681 * patternScale, -0.05229344 * patternScale),
                offset: point2d(5.7305871 * patternScale, -6.9397673 * patternScale),
                dashLengths: [0.63740192 * patternScale, -7.01142112 * patternScale]
            })
            cross.add({
                angle: 46.1842,
                base: point2d(0, 2 * patternScale),
                offset: point2d(6.19462554 * patternScale, -8.84684596 * patternScale),
                dashLengths: [1.125 * patternScale, -12.375 * patternScale]
            })
            cross.add({
                angle: 96.63563549,
                base: point2d(0.88936745 * patternScale, 1.86206693 * patternScale),
                offset: point2d(8.59588239 * patternScale, -10.40964966 * patternScale),
                dashLengths: [0.95610342 * patternScale, -10.5171376 * patternScale]
            })
            cross.add({
                angle: 351.18416399,
                base: point2d(0, 2 * patternScale),
                offset: point2d(7.74327494 * patternScale, 11.05855746 * patternScale),
                dashLengths: [0.9 * patternScale, -9.90000001 * patternScale]
            })
            cross.add({
                angle: 21,
                base: point2d(1 * patternScale, 1.5 * patternScale),
                offset: point2d(4.12975034 * patternScale, -5.89789472 * patternScale),
                dashLengths: [0.75 * patternScale, -8.25 * patternScale]
            })
            cross.add({
                angle: 326,
                base: point2d(1 * patternScale, 1.5 * patternScale),
                offset: point2d(-2.03781207 * patternScale, 7.3723684 * patternScale),
                dashLengths: [0.6 * patternScale, -6.6 * patternScale]
            })
            cross.add({
                angle: 71.45144474,
                base: point2d(1.49742254 * patternScale, 1.16448426 * patternScale),
                offset: point2d(5.7305871 * patternScale, -6.9397673 * patternScale),
                dashLengths: [0.6374019 * patternScale, -7.01142112 * patternScale]
            })
            cross.add({
                angle: 37.5,
                base: point2d(0, 0),
                offset: point2d(2.123 * patternScale, 2.567 * patternScale),
                dashLengths: [0, -6.52 * patternScale, 0, -6.7 * patternScale, 0, -6.625 * patternScale]
            })
            cross.add({
                angle: 7.5,
                base: point2d(0, 0),
                offset: point2d(3.123 * patternScale, 3.567 * patternScale),
                dashLengths: [0, -3.82 * patternScale, 0, -6.37 * patternScale, 0, -2.525 * patternScale]
            })
            cross.add({
                angle: -32.5,
                base: point2d(-2.23 * patternScale, 0),
                offset: point2d(4.6234 * patternScale, 2.678 * patternScale),
                dashLengths: [0, -2.5 * patternScale, 0, -7.8 * patternScale, 0, -10.35 * patternScale]
            })
            cross.add({
                angle: -42.5,
                base: point2d(-3.23 * patternScale, 0),
                offset: point2d(3.6234 * patternScale, 4.678 * patternScale),
                dashLengths: [0, -3.25 * patternScale, 0, -5.18 * patternScale, 0, -7.35 * patternScale]
            })
        }
    },
    {
        id: "fill-pattern-13",
        label: "星点散列纹",
        value: patternModules["../expand/xingdianliesanwen.svg"],
        patternType: "AR_SAND",
        patternCallback: (cross) => {
            const patternScale = 5
            cross.add({
                angle: 37.5,
                base: point2d(0, 0),
                offset: point2d(1.123 * patternScale, 1.567 * patternScale),
                dashLengths: [0, -1.52 * patternScale, 0, -1.7 * patternScale, 0, -1.625 * patternScale]
            })
            cross.add({
                angle: 7.5,
                base: point2d(0, 0),
                offset: point2d(2.123 * patternScale, 2.567 * patternScale),
                dashLengths: [0, -0.82 * patternScale, 0, -1.37 * patternScale, 0, -0.525 * patternScale]
            })
            cross.add({
                angle: -32.5,
                base: point2d(-1.23 * patternScale, 0),
                offset: point2d(2.6234 * patternScale, 1.678 * patternScale),
                dashLengths: [0, -0.5 * patternScale, 0, -1.8 * patternScale, 0, -2.35 * patternScale]
            })
            cross.add({
                angle: -42.5,
                base: point2d(-1.23 * patternScale, 0),
                offset: point2d(1.6234 * patternScale, 2.678 * patternScale),
                dashLengths: [0, -0.25 * patternScale, 0, -1.18 * patternScale, 0, -1.35 * patternScale]
            })
        }
    },
    {
        id: "fill-pattern-999",
        label: "生土",
        value: patternModules["../expand/shengtu.svg"],
        patternType: "ANSI31",
        patternCallback: (cross) => {
            const patternScale = 10
            cross.add({
                angle: 45,
                base: point2d(0, 0),
                offset: point2d(0, 0.125 * patternScale),
                dashLengths: []
            })
        }
    }
]
