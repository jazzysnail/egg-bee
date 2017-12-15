'use strict';

const path = require('path');
const fs = require('fs')

module.exports = (config, app) => {
  const { serviceList, remote } = config;

  if (serviceList) {
    // 根据指定地址拿取配置
    if (typeof serviceList === 'string') {
      const fullPath = path.isAbsolute(serviceList) ? serviceList : path.join(app.baseDir, serviceList)
      if (fs.existsSync(fullPath)) {
        serviceList = require(fullPath)
      }
    }
  } else {
    // 远程获取优先
    if (remote) {
      // 配合其他配置托管平台使用
    } else {
      // 加载默认配置位置上的文件
      const fullPath = path.join(app.baseDir, 'service.bee.config.js')
      if (fs.existsSync(fullPath)) {
        serviceList = require(fullPath)
      }
    }
  }
  // 返回配置对象
  return serviceList
}
