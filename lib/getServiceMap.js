'use strict';

const path = require('path');
const fs = require('fs');

module.exports = (config, app) => {
  const { remote } = config;
  let { serviceMap } = config;

  if (serviceMap) {
    // 根据指定地址拿取配置
    if (typeof serviceMap === 'string') {

      const fullPath = path.isAbsolute(serviceMap)
      ? serviceMap
      : path.join(app.baseDir, serviceMap);

      if (fs.existsSync(fullPath)) {
        serviceMap = require(fullPath);
      }
    }
  } else {
    // 远程获取
    if (remote) {
      // 配合其他配置托管平台使用
    } else {
      // 加载默认配置位置上的文件
      const fullPath = path.join(app.baseDir, 'service.bee.config.js');
      if (fs.existsSync(fullPath)) {
        serviceMap = require(fullPath);
      }
    }
  }
  // 返回配置对象
  return serviceMap;
};
