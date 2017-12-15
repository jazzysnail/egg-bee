# egg-bee

A interface distribution plugin for egg.

> 暂未发布，若需要请 Fork 或 下载使用

## Install

``` base
$ npm i --save egg-bee
```

## Usage & Configuration

``` js
// config/plugin.js
exports.bee = {
  enable: true,
  package: 'egg-bee'
};
```

``` js
// config/config.default.js
module.exports = appInfo => {
  const config = {
    bee: {
      serviceList: null, // 服务列表地址字符串或数组对象，不配置默认读取根目录 service.bee.config.js
      serviceSymbol: 'apiname', // 服务形式标识用以匹配服务名
      app: true // 是否挂载到 app 对象
    }
  };
  return config;
};

```

``` js
// service.bee.config.js
module.exports = {
  test_service_one: [{
    path: 'http://localhost:81/V1/test_service_one'
  }, {
    path: 'http://localhost:82/V1/test_service_one'
  }]
};
```

``` js
// useing in controller
// controller/api.js
const Controller = require('egg').Controller;

class ApiController extends Controller {
  async index() {
    const res = await this.ctx.bee.collect(option);
    this.ctx.body = res;
  }
};

module.exports = ApiController;
```

``` js
// useing in service
module.exports = app => {
  class ApiService extends app.Service {
    async index(req) {
      const res = await app.bee.collect(option)
      return res
    }
  }
  return ApiService
}
```

``` js
// app/router.js
module.exports = app => {
  const { router, controller } = app;
  router.all('/api/:apiname/*', controller.api.index);
};
```

## Api

#### bee.collect(option)

__option:__

- test(res) 容灾测试方法接受服务器相应为入参，返回一个布尔值，判定是否进入容灾
- mixin 自定义请求体（method 和 data 不可写）

## License
[MIT](LICENSE)


