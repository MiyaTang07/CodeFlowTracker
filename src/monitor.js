/**
 * 收集信息：活跃时段，不活跃时段
 * 
*/
const vscode = require("vscode")
const path = require('path')
const fs = require('fs')
const { saveDataToFile } = require('./reporter.js')

let lastRecordedTime = Date.now()
let activeHours = {} // 记录每小时的活跃时间
let activityData = {}  // 存储每小时的活动数据
let lastGitRepoPath = null // 上次记录的 Git 仓库路径

function startMonitoring() {
  // 最近 7 天的周报数据
  scheduleWeeklyReport()
  // 监听文本编辑事件
  vscode.workspace.onDidChangeTextDocument((event) => {
    logActivity()
  })
  // 监听文件切换事件
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      logActivity()
    }
  })

  // 监听光标移动事件
  vscode.window.onDidChangeTextEditorSelection((event) => {
    logActivity()
  })

  // 监听窗口失焦事件
  vscode.window.onDidChangeWindowState((event) => {
    if (event.focused) {
      logActivity()
    }
  })

  // 当打开新文件时，检测是否切换了 Git 仓库
  vscode.workspace.onDidOpenTextDocument(document => {
    logActivity()
    const filePath = document.uri.fsPath
    const currentGitRepoPath = getGitRepoPath(filePath)
    // vscode.window.showInformationMessage(`当前项目GIT仓库：${currentGitRepoPath}`)
    if (currentGitRepoPath && currentGitRepoPath !== lastGitRepoPath) {
        logProjectSwitch()  // 记录项目切换
        lastGitRepoPath = currentGitRepoPath  // 更新最后的 Git 仓库路径
    }
  })
  // 启动每日报告
  scheduleDailyReport()
}

// 记录项目切换
function logProjectSwitch() {
  const now = new Date()
  const currentHour = now.getHours(); // 每次获取当前小时

  if (!activityData[currentHour]) {
      activityData[currentHour] = { operations: 0, switches: 0 }
  }

  activityData[currentHour].switches += 1  // 切换次数
  console.log(`项目切换记录：${currentHour}点，切换次数：${activityData[currentHour].switches}`)
}

// 记录活跃状态
function logActivity() {
  const now = Date.now()
  // 计算自上次记录以来的秒数
  const elapsed = Math.floor((now - lastRecordedTime) / 1000)
  // 如果上次记录以来已经超过1分钟，则增加活跃分钟
  if (elapsed >= 60) {
    const minutesToAdd = Math.floor(elapsed / 60);
    // 更新当前小时的活跃时间
    activeHours[currentHour] = (activeHours[currentHour] || 0) + minutesToAdd;
    lastRecordedTime = now;
  }
  // 记录活动数据
  if (!activityData[currentHour]) {
    activityData[currentHour] = { operations: 0, switches: 0 }
  }

  activityData[currentHour].operations += 1  // 操作次数
}

// 每天的 24点 一过就立即生成当日报告
function scheduleDailyReport() {
  const now = new Date()
  const nextRun = new Date()
  nextRun.setHours(0, 0, 0, 0) // 设置为明天的00:00
  if (now >= nextRun) {
    nextRun.setDate(nextRun.getDate() + 1)
  }
  // 计算距离下一个运行的时间
  const timeUntilNextRun = nextRun - now
  // setTimeout只执行一次
  setTimeout(() => {
    // 生成活跃报告
    generateDailyReport()
    // 生成效率报告
    generateEfficiencyReport()
    // 再次启动每日报告任务
    scheduleDailyReport()
  }, timeUntilNextRun)
}



// 每天生成工作时段报告
function generateDailyReport() {
  let report = "昨日活跃时间段：\n"

  for (let hour = 0; hour < 24; hour++) {
      if (activeHours[hour]) {
          report += `${hour}:00 - ${hour + 1}:00 : ${activeHours[hour]} 分钟活跃时间\n`
      } else {
          report += `${hour}:00 - ${hour + 1}:00 : 无活跃记录\n`
      }
  }
  // 显示报告给用户
  vscode.window.showInformationMessage(report)
  // 保存活跃报告
  saveDataToFile(activeHours, 'daily_active_reports.json')
  // 初始化原始数据
  initializeData()
}

// 初始化数据
function initializeData() {
  lastRecordedTime = Date.now()
  activeHours = {}
  activityData = {}
  lastGitRepoPath = null
}

function analyzeEfficiency() {
  const efficientHours = []
  const inefficientHours = []
  
  for (const hour in activityData) {
      const { operations, switches } = activityData[hour]
      
      // 判断标准：操作次数大于50次并且切换次数小于5次则认为是高效
      if (operations > 50 && switches < 5) {
          efficientHours.push(hour)
      } else {
          inefficientHours.push(hour)
      }
  }
  
  return { efficientHours, inefficientHours }
}

function generateEfficiencyReport() {
  const { efficientHours, inefficientHours } = analyzeEfficiency();

  let report = {
      date: new Date().toISOString().split('T')[0], // 格式化为 YYYY-MM-DD
      efficientHours,
      inefficientHours
  };

  // 显示报告已生成的提示
  vscode.window.showInformationMessage(`昨日效率报告已生成！`);

  // 保存效率报告
  saveDataToFile(report, 'daily_efficient_reports.json')
}

// 获取当前文件所属的 Git 仓库根路径
function getGitRepoPath(filePath) {
  let currentDir = path.dirname(filePath)
  // 向上查找 Git 根目录
  while (currentDir !== path.parse(currentDir).root) {
      const gitDir = path.join(currentDir, '.git')
      if (fs.existsSync(gitDir)) {
          return currentDir // 返回 Git 仓库的根路径
      }
      currentDir = path.dirname(currentDir) // 向上一级目录移动
  }
  return null // 没有找到 Git 仓库
}

module.exports = {
  startMonitoring
}
