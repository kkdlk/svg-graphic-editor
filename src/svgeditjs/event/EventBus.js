/**
 * 事件总线 (EventBus)
 *
 * 提供发布-订阅模式的事件管理机制，用于模块间的松耦合通信。
 * 支持事件的订阅、发布、取消订阅、一次性事件等功能。
 */
export default class EventBus {
    constructor() {
        /** @type {Map<string, Array<{callback: Function, once: boolean}>>} 事件存储器 */
        this._events = new Map()
    }

    /**
     * 订阅事件
     * @param {string|Array<string>} event - 事件名称或事件名称数组
     * @param {Function} callback - 事件处理函数
     * @param {boolean} [once=false] - 是否只执行一次
     * @returns {EventBus} 返回自身，支持链式调用
     */
    on(event, callback, once = false) {
        const events = Array.isArray(event) ? event : [event]
        events.forEach((e) => {
            if (!this._events.has(e)) {
                this._events.set(e, [])
            }
            this._events.get(e).push({ callback, once })
        })
        return this
    }

    /**
     * 订阅一次性事件（执行后自动取消订阅）
     * @param {string|Array<string>} event - 事件名称或事件名称数组
     * @param {Function} callback - 事件处理函数
     * @returns {EventBus} 返回自身，支持链式调用
     */
    once(event, callback) {
        return this.on(event, callback, true)
    }

    /**
     * 取消订阅事件
     * @param {string|Array<string>} event - 事件名称或事件名称数组
     * @param {Function} [callback] - 可选，指定取消的处理函数；不传则取消该事件的所有处理函数
     * @returns {EventBus} 返回自身，支持链式调用
     */
    off(event, callback) {
        const events = Array.isArray(event) ? event : [event]
        events.forEach((e) => {
            if (!this._events.has(e)) {
                return
            }
            const listeners = this._events.get(e)
            if (callback) {
                const index = listeners.findIndex((listener) => listener.callback === callback)
                if (index !== -1) {
                    listeners.splice(index, 1)
                }
            } else {
                this._events.delete(e)
            }
        })
        return this
    }

    /**
     * 发布事件
     * @param {string} event - 事件名称
     * @param {...any} args - 传递给处理函数的参数
     * @returns {boolean} 是否有事件处理函数被调用
     */
    emit(event, ...args) {
        if (!this._events.has(event)) {
            return false
        }
        const listeners = this._events.get(event)
        listeners.forEach((listener) => {
            try {
                listener.callback(...args)
            } catch (error) {
                console.error(`EventBus: Error in event handler for "${event}"`, error)
            }
            if (listener.once) {
                listener.once = false
            }
        })
        listeners
            .filter((listener) => listener.once)
            .forEach((listener, index) => {
                listeners.splice(index, 1)
            })
        return true
    }

    /**
     * 移除所有监听器
     * @param {string} [event] - 可选，指定移除的事件；不传则移除所有事件的所有监听器
     * @returns {EventBus} 返回自身，支持链式调用
     */
    removeAllListeners(event) {
        if (event) {
            this._events.delete(event)
        } else {
            this._events.clear()
        }
        return this
    }

    /**
     * 获取指定事件的监听器数量
     * @param {string|Array<string>} event - 事件名称或事件名称数组
     * @returns {number} 监听器数量（如果是数组，则返回所有事件监听器的总数）
     */
    listenerCount(event) {
        const events = Array.isArray(event) ? event : [event]
        return events.reduce((total, e) => {
            if (this._events.has(e)) {
                total += this._events.get(e).length
            }
            return total
        }, 0)
    }
    /**
     * 销毁事件总线，移除所有事件监听器
     */
    destroy() {
        this.removeAllListeners()
    }
}
