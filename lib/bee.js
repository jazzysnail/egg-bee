'use strict';

const getServiceMap = require('./getServiceMap');

class Bee {
  constructor(ctx) {
    const { app } = ctx;
    this.ctx = ctx;
    this.config = app.config.bee;
    this.serviceMap = getServiceMap(app.config.bee, app);
  }
  /**
   * 读取配置到栈并开始发起请求返回结果
   * @param  {[type]} serviceName [服务名称]
   * @param  {[type]} urn         urn
   * @param  {[type]} options     [请求（curl）的配置]
   * @param  {[type]} test        [测试方法]
   * @return {[type]}             [resData]
   */
  _call(serviceName, urn, options, test = () => false) {
    const { ctx, serviceMap } = this;
    // 调用栈
    const callStack = serviceMap[serviceName];
    // 请求服务器并返回完整响应，如果测试失败则递归尝试备用服务器
    const reqRing = async function () {
      let uri = callStack[0].path + urn;
      ctx.app.logger.info(`[egg-bee] >>>>>  request start  >>>>>`);
      ctx.app.logger.info(`[egg-bee] service name: ${serviceName}`);
      ctx.app.logger.info(`[egg-bee] uri: ${uri}`);
      ctx.app.logger.info(`[egg-bee] =========================`);
      const res = await ctx.curl(uri, options);
      if (test(res) && callStack.length > 1) {
        ctx.app.logger.warn(`[egg-bee] 数据测试未通过开始请求备用服务器`);
        reqRing(callStack.shift());
      }
      ctx.app.logger.info(res.data);
      ctx.app.logger.info(`[egg-bee] <<<<< response success <<<<<`);
      return res;
    }
    const res = reqRing();
    return res;
  }
  // 由服务器主动发起 http 请求，不同的是会从 bee 的配置中读取相应的地址信息
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
   * {
   *   test {Function} 容灾测试方法入参为 res 返回一个布尔值，判定什么情况下进入容灾
   * }
   * @return {Object} 服务器相应体
   */
  async collect(options = {}) {
    const { config, ctx, serviceMap } = this;
    const { method, body, url } = ctx.request;
    const _mixin = options.mixin || {};
    // 用户定义的服务标志
    const serviceIdent = config.serviceIdent;
    // 实际的服务名
    const serviceName = ctx.params[serviceIdent];
    const urn = url.split(serviceName)[1];
    const reqOption = Object.assign({}, {
      contentType: 'json',
      dataType: 'json',
    }, _mixin, {
      method,
      data: body,
    });
    return this._call( serviceName, urn, reqOption, options.test);
  }
};

module.exports = Bee;
