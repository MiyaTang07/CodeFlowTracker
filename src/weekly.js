const vscode = require("vscode")
const path = require("path")
const fs = require("fs")
const { saveDataToFile } = require('./reporter')

// 读取 JSON 文件内容并返回解析后的数据
function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        try {
          const jsonData = JSON.parse(data)
          resolve(jsonData)
        } catch (parseErr) {
          reject(parseErr)
        }
      }
    })
  })
}

// 生成周报
async function generateWeeklyReport() {
  try {
    // 文件路径
    const activeReportFilePath = path.join(global.globalStoragePath, 'daily_active_reports.json')
    const efficientReportFilePath = path.join(global.globalStoragePath, 'daily_efficient_reports.json')

    // 读取活跃和效率报告
    const activeReports = await readJsonFile(activeReportFilePath)
    const efficientReports = await readJsonFile(efficientReportFilePath)

    // 获取最近 7 天的数据
    const last7DaysActive = getLast7DaysData(activeReports)
    const last7DaysEfficient = getLast7DaysData(efficientReports)

    // 分析汇总一周的数据
    const weeklyReport = analyzeWeeklyData(last7DaysActive, last7DaysEfficient)

    // 显示周报
    vscode.window.showInformationMessage("本周工作周报已生成！")
    saveDataToFile(weeklyReport, "weekly_report.json")

  } catch (err) {
    console.error("生成周报时出错:", err)
    vscode.window.showErrorMessage("生成周报时出错，请检查数据文件格式。")
  }
}

// 获取最近 7 天的数据
function getLast7DaysData(reportData) {
  const today = new Date()
  const last7DaysData = reportData.filter(report => {
    const reportDate = new Date(report.date)
    const diffInTime = today.getTime() - reportDate.getTime()
    const diffInDays = diffInTime / (1000 * 3600 * 24)
    return diffInDays <= 7
  })
  return last7DaysData
}

// 分析周活跃与效率数据
function analyzeWeeklyData(activeReports, efficientReports) {
  let totalActiveMinutes = 0
  let efficientHours = []
  let inefficientHours = []
  let totalProjectSwitches = 0

  // 累计每一天的数据
  activeReports.forEach((report) => {
    for (let hour in report) {
      totalActiveMinutes += report[hour] || 0  // 累计每小时的活跃时间
    }
  })

  efficientReports.forEach((report) => {
    efficientHours = efficientHours.concat(report.efficientHours)
    inefficientHours = inefficientHours.concat(report.inefficientHours)
  })

  // 去重处理高效和低效时间段
  efficientHours = [...new Set(efficientHours)]
  inefficientHours = [...new Set(inefficientHours)]

  // 生成汇总报告
  const weeklyReport = {
    totalActiveMinutes,
    efficientHours,
    inefficientHours,
    averageActiveMinutes: (totalActiveMinutes / 7).toFixed(2), // 平均每天活跃时间
    projectSwitches: totalProjectSwitches // 假设在 logProjectSwitch 里处理切换计数
  }

  return weeklyReport
}

// 定时每周一生成周报
function scheduleWeeklyReport() {
  const now = new Date()
  const nextMonday = new Date()
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7)) // 计算下一个周一
  nextMonday.setHours(0, 0, 0, 0)  // 设置为周一 0 点
  const timeUntilNextMonday = nextMonday - now

  setTimeout(() => {
    generateWeeklyReport() // 生成周报
    scheduleWeeklyReport()  // 再次启动
  }, timeUntilNextMonday)
}

module.exports = {
  scheduleWeeklyReport
}
