/**
 * @description 颜色工具类
 * @author ytzjj
 */

class ColorUtil {
	/**
	 * 内部方法：统一解析 hex 为数值
	 */
	static hexToRgbValues(hex) {
		let cleanHex = hex.replace("#", "")

		// 处理 3 位简写形式 #ABC -> #AABBCC
		if (cleanHex.length === 3) {
			cleanHex = cleanHex
				.split("")
				.map((char) => char + char)
				.join("")
		}
		const num = parseInt(cleanHex, 16)
		// 处理可能的 8 位 hex（包含透明度）
		if (cleanHex.length === 8) {
			return {
				r: (num >> 24) & 255,
				g: (num >> 16) & 255,
				b: (num >> 8) & 255,
				a: (num & 255) / 255,
			}
		}
		// 默认 6 位 hex（不包含透明度）
		return {
			r: (num >> 16) & 255,
			g: (num >> 8) & 255,
			b: num & 255,
			a: 1,
		}
	}
	/**
	 * 十六进制转 RGBA 字符串
	 */
	static hexToRgba(hex, opacity = 1) {
		const { r, g, b, a } = this.hexToRgbValues(hex)
		return `rgba(${r}, ${g}, ${b}, ${opacity === void 0 ? a : opacity})`
	}
	/**
	 * RGB 转十六进制
	 */
	static rgbToHex(r, g, b) {
		const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
		return `#${((1 << 24) | (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).slice(1)}`.toUpperCase()
	}
	/**
	 * 解析 RGBA 字符串为数值对象
	 * 支持格式: "rgba(255, 0, 0, 0.5)", "rgb(255, 0, 0)", "255, 0, 0, 0.5" 以及百分比
	 */
	static rgbaStringToRgbaValues(rgbaString) {
		// 1. 处理非字符串或空值情况
		if (typeof rgbaString !== "string") {
			return { r: 255, g: 255, b: 255, a: 1 }
		}
		// 2. 更精确的正则：匹配数字、小数点或百分号
		const match = rgbaString.match(/([\d.]+)%?/g)

		if (!match || match.length < 3) {
			return { r: 255, g: 255, b: 255, a: 1 }
		}
		// 3. 辅助函数：处理 0-255 数值或 0-100% 百分比
		const parseComponent = (val, index) => {
			const isPercent = rgbaString.includes("%") && val.includes("%")
			const num = parseFloat(val)
			if (index < 3) {
				// R, G, B 通道
				const result = isPercent ? (num * 255) / 100 : num
				return Math.max(0, Math.min(255, Math.round(result)))
			}
			// Alpha 通道
			const result = isPercent ? num / 100 : num
			return Math.max(0, Math.min(1, result))
		}

		return {
			r: parseComponent(match[0], 0),
			g: parseComponent(match[1], 1),
			b: parseComponent(match[2], 2),
			a: match[3] !== void 0 ? parseComponent(match[3], 3) : 1,
		}
	}
	/**
	 * RGBA 字符串转 16 进制颜色 (包含 Alpha 适配)
	 */
	static rgbaStringToHex(rgbaString) {
		const match = rgbaString.match(/[\d.]+/g)
		if (!match || match.length < 3) {
			return "#FFFFFF"
		}
		const r = Math.min(255, parseInt(match[0]))
		const g = Math.min(255, parseInt(match[1]))
		const b = Math.min(255, parseInt(match[2]))
		const a = match[3] !== undefined ? parseFloat(match[3]) : 1
		// 使用位运算合成
		let hex = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
		if (a < 1) {
			const alpha = Math.round(a * 255)
				.toString(16)
				.padStart(2, "0")
			hex += alpha
		}
		return hex.toUpperCase()
	}
	/**
	 * 将 RGB 颜色值转换为十六进制颜色值
	 * @param c
	 * @returns {string|string}
	 */
	static componentToHex(c) {
		const hex = c.toString(16)
		return hex.length === 1 ? `0${hex}` : hex
	}

	/**
	 * 随机生成颜色，支持设置生成颜色亮度，并指定生成数量，且不能重复
	 * @param {number} count
	 * @param {number} brightness 0.1-1
	 * @returns {*[]}
	 */
	static generateRandomColors(count, brightness = 1) {
		const colors = []
		// Generate random RGB values and adjust brightness
		for (let i = 0; i < count; i++) {
			let r = Math.floor(Math.random() * 256)
			let g = Math.floor(Math.random() * 256)
			let b = Math.floor(Math.random() * 256)
			if (brightness < 0) {
				r = Math.max(0, Math.floor(r * (1 + brightness)))
				g = Math.max(0, Math.floor(g * (1 + brightness)))
				b = Math.max(0, Math.floor(b * (1 + brightness)))
			} else {
				r = Math.min(255, Math.floor(r * brightness))
				g = Math.min(255, Math.floor(g * brightness))
				b = Math.min(255, Math.floor(b * brightness))
			}
			// Convert to hex string
			const color = `#${ColorUtil.componentToHex(r)}${ColorUtil.componentToHex(g)}${ColorUtil.componentToHex(b)}`
			colors.push(color)
		}
		// Remove duplicates
		return [...new Set(colors)]
	}
}

export default ColorUtil
