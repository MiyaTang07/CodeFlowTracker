/**
 * 生成生成报告模块
 * src/reporter.js
 */
const fs = require("fs")
const path = require("path")

function saveDataToFile(data, jsonName = "daily_reports.json") {
  const now = new Date()
  const filePath = path.join(global.globalStoragePath, jsonName)

  // 如果文件不存在，则创建文件并写入
  fs.readFile(filePath, (err, content) => {
    let reports = []
    if (!err) {
      reports = JSON.parse(content.toString() || "[]")
    }

    // 添加今天的报告数据
    reports.push({
      date: now.toISOString().split("T")[0],
      data: data,
    })

    // 写入更新后的报告数据
    fs.writeFile(filePath, JSON.stringify(reports, null, 2), (err) => {
      if (err) {
        vscode.window.showErrorMessage("保存报告时出错")
      } else {
        console.log("报告已保存")
      }
    })
  })
}


module.exports = {
  saveDataToFile
}
