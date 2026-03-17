export const dashArray = [
	{
		label: "实线",
		value: "none",
		lineType: "Continuous",
		lineTypeArr: [], // 实线不需要图案
	},
	{
		label: "虚线",
		value: "5 5",
		lineType: "Dotted",
		lineTypeArr: [5, -5], // 5单位线段，5单位间隔
	},
	{
		label: "点线",
		value: "10 10",
		lineType: "Dot",
		lineTypeArr: [0, -10], // 点(0)，10单位间隔
	},
	{
		label: "点虚线",
		value: "10 5",
		lineType: "Dot_Dotted",
		lineTypeArr: [0, -5, 5, -5], // 点，5间隔，5线段，5间隔
	},
	{
		label: "点点线",
		value: "10 10 5 10",
		lineType: "Dot_Dot",
		lineTypeArr: [0, -5, 0, -5, 5, -5], // 点，5间隔，点，5间隔，5线段，5间隔
	},
]
