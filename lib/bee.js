'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const getServiceMap = require('./getServiceMap');

class Bee {
  constructor(ctx) {
    const { app } = ctx;
    this.ctx = ctx;
    this.config = app.config.bee;
    console.log(app.config);
    this.baseDir = app.config.baseDir;
    this.serviceMap = getServiceMap(app.config.bee, app);
  }






  /**
   * 读取配置到栈并开始发起请求返回结果
   * @param  {[String]} serviceName [服务名称]
   * @param  {[String]} urn         [接口名]
   * @param  {[Object]} options     [请求（curl）的配置]
   * @param  {[Function]} test      [测试方法]
   * @return {[JSON]}               [响应体]
   */
  _call(serviceName, urn, options, test = () => false) {
    const { ctx, serviceMap } = this;
    // 要被代理到 mock 的服务队列
    const mockServiceList = this.config.mock || [];
    // 获取本次要被代理到 mock 的服务名，及配置
    const mockServiceName = mockServiceList.find(val => {
      if (Array.isArray(val)) {
        // 预留位置处理自定义 mock 配置
        return serviceName === val[0];
      } else {
        return serviceName === val;
      }
    });
    // 三方接口调用栈
    const callStack = serviceMap[serviceName];
    // 请求服务器并返回完整响应，如果测试失败则递归尝试备用服务器
    const reqRing = async () => {
      // 完整的请求地址
      let uri = callStack[0].path + urn;
      // 打印请求开始的日志
      ctx.app.logger.info(`[egg-bee] >>>>>  request start  >>>>>`);
      ctx.app.logger.info(`[egg-bee] service name: ${serviceName}`);
      ctx.app.logger.info(`[egg-bee] uri: ${uri}`);
      ctx.app.logger.info(`[egg-bee] =========================`);

      let res = {data: null};
      // 向三方服务器发起请求或获取 mock 数据
      if (mockServiceName) {
        // 默认的 mock 数据获取地址
        let mockFilePath = path.join(this.baseDir, 'app', 'mock', serviceName, urn);
        // 判断用户是否配置了自定义的 mock 地址
        if (Array.isArray(mockServiceName)) {
          const customizedPath = path.isAbsolute(mockServiceName[1]) ? mockServiceName[1] : path.join(this.baseDir, mockServiceName[1]);
          mockFilePath = path.join(customizedPath, serviceName, urn) || mockFilePath;
        }
        // 读取数据
        if (fs.existsSync(`${mockFilePath}.js`) || fs.existsSync(`${mockFilePath}/index.js`)) {
          res = await new Promise((resolve, reject) => {
            resolve({data: require(mockFilePath)})
          });
        } else {
          ctx.app.logger.error(`[egg-bee] not find mock file or dir, with ${mockFilePath}!`);
        }
      } else {
        res = await ctx.curl(uri, options);
      }

      // 测试数据完整性(通过测试并调用栈不为空并不是 mock)
      if (test(res) && callStack.length > 1 && !mockServiceName) {
        ctx.app.logger.warn(`[egg-bee] 数据测试未通过开始请求备用服务器`);
        // 未通过测试栈顶出栈进入下一次请求
        reqRing(callStack.shift());
      }
      // 打印请求完成的日志
      ctx.app.logger.info(res.data);
      ctx.app.logger.info(`[egg-bee] <<<<< response success <<<<<`);
      // 返回数据
      return res;
    }
    return reqRing()
  }





  /**
   * 由服务器主动发起 http 请求，不同的是会从 bee 的配置中读取相应的地址信息
   * @param  {[String]} url     [`${serviceName}`${urn}]
   * @param  {[Object]} options [请求（curl）的配置]
   * @return {[JSON]}           [响应体]
   */
  async curl(url, options) {
    const {ctx, serviceMap} = this;
    // 实际的服务名
    const pathSnippets = url.split('/').filter(i => i);
    const serviceName = pathSnippets[0];
    const urn = pathSnippets[1];
    return this._call(serviceName, `/${urn}`, options);
  }







  /**
   * 根据配置采集数据
   * @param  {Object} option
   *   #mixin  {Object}   [要混入到请求配置当中的自定义配置，其中 method data 不被覆盖]
   *   #test   {Function} [容灾测试方法入参为 res 返回一个布尔值，判定什么情况下进入容灾]
   * @return {Object} [响应体]
   */
  async collect(options = {}) {
    const { config, ctx, serviceMap } = this;
    const { method, body, url, headers } = ctx.request;
    const _mixin = options.mixin || {};
    const _test = options.test;
    // 用户定义的服务标志
    const serviceIdent = config.serviceIdent;
    // 实际的服务名
    const serviceName = ctx.params[serviceIdent];
    const urn = url.split(serviceName)[1];
    // 将配置中的 headers 属性移动到变量 mixinHeaders 上，然后删除自身属性，备用混合
    const mixinHeaders = _mixin.headers;
    delete _mixin.headers;

    const reqOption = Object.assign({}, {
      headers: Object.assign({}, headers, mixinHeaders),
      contentType: 'json',
      dataType: 'json',
    }, _mixin, {
      method,
      data: body,
    });
    return this._call( serviceName, urn, reqOption, _test);
  }
};

module.exports = Bee;
