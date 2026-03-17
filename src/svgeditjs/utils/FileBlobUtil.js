/**
 * 文件转Blob
 * @param blob {blob}
 * @returns {null}
 */
export const fileToBlobUrl = (blob) => {
    let url = null
    if (window.createObjectURL !== void 0) {
        // basic
        url = window.createObjectURL(blob)
    } else if (window.URL !== void 0) {
        // mozilla(firefox)
        url = window.URL.createObjectURL(blob)
    } else if (window.webkitURL !== void 0) {
        // webkit or chrome
        url = window.webkitURL.createObjectURL(blob)
    }
    return url
}

// 销毁对象 URL
export const revokeBlobUrl = (url) => {
    if (!url) {
        return
    }
    if (window.URL && window.URL.revokeObjectURL) {
        window.URL.revokeObjectURL(url)
    } else if (window.webkitURL && window.webkitURL.revokeObjectURL) {
        window.webkitURL.revokeObjectURL(url)
    } else if (window.revokeObjectURL) {
        // 兼容旧版浏览器
        window.revokeObjectURL(url)
    } else {
        console.error("Your browser doesn't support revoking object URLs")
    }
}
/**
 * 下载文件
 * @param url
 * @param filename
 */
export const downloadFile = (url, filename) => {
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = filename || String(+new Date())
    a.click()
}
