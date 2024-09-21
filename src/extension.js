/**
 * 插件的主逻辑
*/
const vscode = require('vscode')
const { startMonitoring } = require('./monitor')

function activate(context) {
    startMonitoring()
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}


