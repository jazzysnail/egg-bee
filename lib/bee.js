'use strict';

const getServiceList = require('./getServiceList');

class Bee {
  constructor(ctx) {
    const { app } = ctx;
    this.ctx = ctx;
    this.config = app.config.bee;
    this.serviceList = getServiceList(app.config.bee, app);
  }
  /**
   * 根据配置采集数据
   * @param  {Object} option
   * {
   *   test {Function} 容灾测试方法入参为 res 返回一个布尔值，判定什么情况下进入容灾
   * }
   * @return {Object}   服务器相应体
   */
  async collect(option = {
    // 接口容灾测试方法默认不容灾
    test: () => false
  }) {
    const { config, ctx, serviceList } = this;
    const { method, body, url } = ctx.request;
    // 用户定义的服务标志
    const serviceSymbol = config.serviceSymbol;
    // 实际的服务名
    const serviceName = ctx.params[serviceSymbol];
    const urn = url.split(serviceName)[1]
    // 调用栈
    const callStack = serviceList[serviceName]
    // 请求服务器并返回完整响应，如果测试失败则递归尝试备用服务器
    const reqRing = async function () {
      let uri = callStack[0].path + urn;
      ctx.app.logger.info(`[egg-bee] 开始请求服务：${uri}`);
      const res = await ctx.curl(uri, {
        method,
        data: body,
        dataType: 'json'
      })
      if (option.test(res) && callStack.length > 1) {
        ctx.app.logger.warn(`[egg-bee] 容灾处理开始请求备用服务器：${uri}`);
        reqRing(callStack.shift())
      }
      ctx.app.logger.info(`[egg-bee] 数据获取成功：${res.body}`);
      return res
    }
    const res = reqRing();
    return res
  }
}

module.exports = Bee
