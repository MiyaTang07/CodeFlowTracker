/**
 * 插件的主逻辑
 * src/extension.js
*/
const vscode = require("vscode")
const { startMonitoring } = require('./monitor')
const path = require('path')
const fs = require('fs')

function activate(context) {
    // 获取全局存储路径
    global.globalStoragePath = context.globalStorageUri.fsPath

    // 创建存储目录（如果还不存在）
    if (!fs.existsSync(globalStoragePath)) {
        fs.mkdirSync(globalStoragePath, { recursive: true });
    }
    // 启动监控
    startMonitoring(context)
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}


