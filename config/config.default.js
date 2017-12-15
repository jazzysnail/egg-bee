'use strict';

const path = require('path');

module.exports = () => {
  const config = {};

  config.bee = {
    // 服务器列表
    serviceList: null,
    // 服务器形式标识
    serviceSymbol: '',
    // 是否加载到 app 上
    app: true
  };

  return config;
};
