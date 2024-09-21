/**
 * 监控用户活动的模块
 */
const vscode = require("vscode")
const { exec } = require('child_process')

let lastActiveTime = Date.now() // 最后更新时间
const NON_ACTIVE_MIN = 5
// 记录工作会话信息
let workSessions = []
let currentProject = '' // 当前活动项目
const projectActivity = {} // 存储项目活动信息

function startMonitoring() {
  // 切换活动的编辑器
  vscode.window.onDidChangeActiveTextEditor(async editor => {
    updateLastActiveTime()
    if (editor) {
      const filePath = editor.document.uri.fsPath // 获取文件路径
      try {
        console.log('Monitor: filePath', filePath)
        currentProject = await getGitProjectName(filePath) // 获取项目名称
        updateProjectActivity(currentProject)
      } catch (error) {
          console.error('无法获取 Git 仓库名称:', error)
      }
    }
  })

  // 选择操作：移动光标、选中文本
  vscode.window.onDidChangeTextEditorSelection(() => {
    updateLastActiveTime()
  })

  // 用户输入时
  vscode.workspace.onDidChangeTextDocument(() => {
    updateLastActiveTime()
  })

  // 定时器每分钟检查一次，提示用户实际不活动的时间
  setInterval(() => {
    vscode.window.showWarningMessage('定时器开始执行')
    const elapsed = Date.now() - lastActiveTime
    if (elapsed > NON_ACTIVE_MIN * 60 * 1000) {
      const elapsedMinutes = Math.floor(elapsed / 60000, 1)

      // 超过设定时间，记录会话结束
      workSessions.push({ start: lastActiveTime - elapsed, end: lastActiveTime })

      vscode.window.showWarningMessage(`你已超过${elapsedMinutes}分钟没有操作了，请注意休息。`)
    }
  }, 1 * 60 * 1000)
}

// 更新最后活动时间
function updateLastActiveTime() {
  lastActiveTime = Date.now()
}

// 获取当前文件的git仓库名称
function getGitProjectName(filePath) {
  return new Promise((resolve, reject) => {
      exec('git rev-parse --show-toplevel', { cwd: filePath }, (error, stdout) => {
          if (error) {
              return reject(error)
          }
          const repoPath = stdout.trim()
          const projectName = repoPath.split('/').pop() // 获取最后一部分作为项目名称
          resolve(projectName)
      })
  })
}

// 获取项目参与活跃时间
function updateProjectActivity(project) {
  const currentTime = new Date()
  const dateKey = currentTime.toISOString().split('T')[0] // 获取当前日期字符串
  if (!projectActivity[project]) {
      projectActivity[project] = { totalTime: 0, lastActive: 0, daysActive: {} }
  }

  if (!projectActivity[project].daysActive[dateKey]) {
      projectActivity[project].daysActive[dateKey] = 0
  }
  
  projectActivity[project].daysActive[dateKey] += Date.now() - lastActiveTime // 累加活跃时间
}

module.exports = {
  startMonitoring
}
