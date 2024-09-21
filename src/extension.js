/**
 * 插件的主逻辑
*/
const vscode = require('vscode')
const { startMonitoring } = require('./monitor')

function activate(context) {
	// 指令开始监控自己的用户行为
    let disposable = vscode.commands.registerCommand('codeflowtracker.start', () => {
        // 开始进行监控
		startMonitoring()
        vscode.window.showInformationMessage('CodeFlowTracker 已启动！')
    })

    context.subscriptions.push(disposable)
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}


