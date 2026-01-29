// 完整的 EditorState.js 文件内容
import { CANVAS_DEFAULT_OPTIONS } from "../constant/BasicConfig.js"

class EditorState {
    constructor(state) {
        this._state = {}
        this._stateListeners = new Map()
        this._proxyState = this._createProxy(this._state)
        // 重置状态
        this.resetState(this._mergeDefaultOptions(state))
    }

    _mergeDefaultOptions(state) {
        const defaultOptions = {
            ...CANVAS_DEFAULT_OPTIONS,
            ...(state || {})
        }
        defaultOptions.panZoomOptions = {
            ...CANVAS_DEFAULT_OPTIONS.panZoomOptions,
            ...(state?.panZoomOptions || {})
        }
        defaultOptions.selectOptions = {
            ...CANVAS_DEFAULT_OPTIONS.selectOptions,
            ...(state?.selectOptions || {})
        }
        return defaultOptions
    }

    // 递归 Proxy 创建方法 - 修复了 this 指向问题
    _createProxy(state, parentPath = "") {
        const self = this
        return new Proxy(state, {
            set(target, property, value) {
                const oldValue = target[property]

                // 如果新值是对象且不是代理，递归创建代理
                if (value !== null && typeof value === "object" && !self._isProxy(value)) {
                    value = self._createProxy(value, parentPath ? `${parentPath}.${property}` : property)
                }
                target[property] = value
                if (oldValue !== value) {
                    const fullPath = parentPath ? `${parentPath}.${property}` : property
                    self._notifyStateChange({ [fullPath]: value }, { [fullPath]: oldValue })
                }
                return true
            },
            get(target, property) {
                const value = target[property]
                // 如果获取的是对象且不是代理，递归创建代理
                if (value !== null && typeof value === "object" && !self._isProxy(value)) {
                    const fullPath = parentPath ? `${parentPath}.${property}` : property
                    target[property] = self._createProxy(value, fullPath)
                    return target[property]
                }
                return value
            }
        })
    }

    // 辅助方法：检查对象是否为 Proxy - 更可靠的实现
    _isProxy(obj) {
        if (typeof obj !== "object" || obj === null) return false
        try {
            // 检查是否有 __ProxyTarget__ 属性（某些环境下可用）
            return !!obj.__ProxyTarget__ || Object.prototype.toString.call(obj) === "[object Proxy]"
        } catch (e) {
            return false
        }
    }

    // 修复的 setState 方法 - 避免重复触发通知
    setState(key, value) {
        // 直接使用原始state对象更新，避免触发Proxy陷阱
        const keys = key.split(".")
        let current = this._state
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {} // 确保路径存在
            }
            current = current[keys[i]]
        }
        const lastKey = keys[keys.length - 1]
        const oldValue = current[lastKey]
        current[lastKey] = value
        // 更新Proxy对象的引用
        if (keys.length === 1) {
            this._proxyState[lastKey] = value
        } else {
            // 对于嵌套属性，需要确保Proxy对象的路径也被更新
            let proxyCurrent = this._proxyState
            for (let i = 0; i < keys.length - 1; i++) {
                proxyCurrent = proxyCurrent[keys[i]]
            }
            proxyCurrent[lastKey] = value
        }
        if (oldValue !== value) {
            this._notifyStateChange({ [key]: value }, { [key]: oldValue })
        }
        return this
    }

    getState(key) {
        if (key === void 0) {
            return JSON.parse(JSON.stringify(this._state)) // 返回状态快照
        }

        // 支持嵌套属性访问，如 getState('panZoomOptions.zoom')
        const keys = key.split(".")
        let current = this._state

        for (const k of keys) {
            if (current === null || current === undefined) {
                return undefined
            }
            current = current[k]
        }

        return current
    }

    resetState(newState) {
        const oldState = { ...this._state }
        this._state = this._mergeDefaultOptions(newState)
        this._proxyState = this._createProxy(this._state)
        this._notifyStateChange(this._state, oldState)
        return this
    }

    subscribe(keys, callback) {
        if (!callback || typeof callback !== "function") {
            console.warn("状态监听需要提供回调函数")
            return () => {}
        }

        const keyList = Array.isArray(keys) ? keys : [keys]

        // 为每个键添加回调，并在回调中标记原始的 keyList
        keyList.forEach((key) => {
            if (!this._stateListeners.has(key)) {
                this._stateListeners.set(key, new Set())
            }
            // 存储回调和原始的 keyList 信息
            this._stateListeners.get(key).add({ callback, keyList })
        })

        return () => {
            keyList.forEach((key) => {
                const listeners = this._stateListeners.get(key)
                if (listeners) {
                    // 找到并删除对应的监听器对象
                    for (const listener of listeners) {
                        if (listener.callback === callback) {
                            listeners.delete(listener)
                            break
                        }
                    }
                }
            })
        }
    }

    subscribeAll(callback) {
        if (!callback || typeof callback !== "function") {
            console.warn("需要提供回调函数")
            return () => {}
        }

        if (!this._stateListeners.has("*")) {
            this._stateListeners.set("*", new Set())
        }
        this._stateListeners.get("*").add(callback)

        return () => {
            const listeners = this._stateListeners.get("*")
            if (listeners) {
                listeners.delete(callback)
            }
        }
    }

    // 修复的通知方法 - 确保每个监听器只被通知一次
    _notifyStateChange(changes, oldValues) {
        const notifiedListeners = new Set() // 避免重复通知同一个监听器

        Object.keys(changes).forEach((key) => {
            // 获取所有相关的父路径键
            const keyPaths = this._getAllKeyPaths(key)

            // 去重路径，确保不会重复通知
            const uniquePaths = [...new Set(keyPaths)]

            // 通知所有相关路径的监听器
            uniquePaths.forEach((path) => {
                const listeners = this._stateListeners.get(path)
                if (listeners) {
                    listeners.forEach((listener) => {
                        // 检查监听器是否已经被通知过
                        const callbackToCheck = typeof listener === "function" ? listener : listener.callback
                        if (!notifiedListeners.has(callbackToCheck)) {
                            try {
                                if (typeof listener === "function") {
                                    // 传统的单个监听器
                                    const currentValue = this.getState(path)
                                    const oldValue = this._getOldValueForPath(path, oldValues, key)
                                    listener(currentValue, oldValue, path)
                                } else {
                                    // 批量键监听器
                                    const values = listener.keyList.map((k) => this.getState(k))
                                    listener.callback(...values)
                                }
                                notifiedListeners.add(callbackToCheck)
                            } catch (error) {
                                console.error(`状态监听器错误(${path}):`, error)
                            }
                        }
                    })
                }
            })
        })

        // 通知全局监听器
        const allListeners = this._stateListeners.get("*")
        if (allListeners) {
            allListeners.forEach((callback) => {
                try {
                    callback(changes, this._state, oldValues)
                } catch (error) {
                    console.error("全局状态监听器错误:", error)
                }
            })
        }
    }

    // 辅助方法：获取所有父路径，包括完整路径本身
    _getAllKeyPaths(key) {
        const keys = key.split(".")
        const paths = []

        for (let i = 1; i <= keys.length; i++) {
            paths.push(keys.slice(0, i).join("."))
        }

        return paths
    }

    // 辅助方法：获取路径对应的旧值
    _getOldValueForPath(path, oldValues, originalKey) {
        if (path === originalKey) {
            return oldValues[originalKey]
        }

        // 对于父路径，需要从原始的oldValues中重建对象结构
        const keys = path.split(".")
        let current = this._state

        for (const key of keys) {
            if (current === null || current === undefined) {
                return undefined
            }
            current = current[key]
        }

        return JSON.parse(JSON.stringify(current))
    }

    snapshot() {
        return JSON.parse(JSON.stringify(this._state))
    }

    destroy() {
        this._stateListeners.clear()
        this._state = {}
        this._proxyState = {}
    }

    // Getters for specific state properties
    get panZoomOptions() {
        return this._proxyState.panZoomOptions
    }

    get selectOptions() {
        return this._proxyState.selectOptions
    }

    get state() {
        return this._proxyState
    }
}

export default EditorState
