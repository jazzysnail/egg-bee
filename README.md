# egg-bee

[![npm](https://img.shields.io/npm/v/egg-bee.svg)](https://www.npmjs.com/package/egg-bee)
[![npm](https://img.shields.io/npm/dm/egg-bee.svg)](https://www.npmjs.com/package/egg-bee)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/jazzysnail/egg-bee/blob/master/LICENSE)

[English](./README.en.md)

一个完全可配置的客户端请求代理插件。

他将简单快速的代理来自客户端的请求到其他的服务进行数据处理，而且支持遇到灾难时使用备用服务器。

插件将服务地址配置单独分离出来，可以配合其他配置管理工具完成统一高效的配置管理。

他不仅仅可以代理到远程服务，同时还可以代理到本地 mock，配合其他 mock 工具实现复杂的数据模拟，方便前端独立于后端并行开发。

## 安装

``` base
$ npm i egg-bee --save
```

## 使用 & 配置

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
      serviceMap: null, // 服务列表，可以是一个文件地址也可以使用对象字面量（不推荐），或者不进行配置默认将读取应用根目录的 service.bee.config.js 文件。
      serviceIdent: 'service', // 服务名标识字段，用于代理时的自动捕获。
      app: true, // 是否挂载到 App 实例。
      mock: ['test_service_one', ['test_service_two', 'mock']], // 对队列中的服务使用 mock 代理（本地）。数组元素可以是服务名字符串也可以是一个长度为二的数组，第二个元素将被作为代理路径，如果使用相对路径将从应用根目录开始。
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
// app/mock/test_service_one/list.js
// mock 文件的路径使用与接口相同路径
module.exports = {
  status: 0,
  data_list: [{
    id: '007',
    name: 'leon'
  }],
  total: 1,
  index: 1,
  size: 15,
  msg: "test data"
}
```

``` js
// 在 controller 中使用
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
// 在 service 中使用
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
  // :service 是上面所述的配置中 serviceIdent 字段的值。
  // 插件将根据 serviceIdent 自动读取服务地址，并加以拼接后面的 /* 接口名，进行访问并返回数据。
  router.all('/api/:service/*', controller.api.index);
};
```

## 实例方法

### bee.collect(option)

__option:__

- test(res)

一个数据测试函数，接受服务器响应作为入参并返回一个布尔值。如果测试结果失败，将根据配置尝试请求备用服务器。

- mixin

请求配置混合字段，用于自定义 HttpClient 的请求配置。更多查看 [Details](https://eggjs.org/zh-cn/core/httpclient.html#options-%E5%8F%82%E6%95%B0%E8%AF%A6%E8%A7%A3)。

插件还会默认将来自客户端的请求头混入服务端请求头部中。

但是 method 和 data 字段目前不支持被覆盖，插件本身是为一些列需要分发到不同处理服务上的请求做代理的，所以我们只需要注册一个接受任何请求方法的标识路由，剩下的就交给 egg-bee 吧。

### bee.curl(url, option)

就像是 `ctx.curl` 方法一样，但是不同的是请求地址将从服务名开始。插件默认第一个路径起点为服务名，并将自动读取配置进行请求发起。查看下面的例子。

``` js
// in controller
const { bee, header } = this.ctx;
const checkLogin =  bee.curl('test_service_one/islogin', {
  headers: header,
  method: 'GET',
  contentType: 'json',
  dataType: 'json',
});
```

## License
[MIT](LICENSE)


