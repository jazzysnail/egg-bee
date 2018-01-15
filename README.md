# egg-bee

[![npm](https://img.shields.io/npm/v/egg-bee.svg)](https://www.npmjs.com/package/egg-bee)
[![npm](https://img.shields.io/npm/dm/egg-bee.svg)](https://www.npmjs.com/package/egg-bee)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/jazzysnail/egg-bee/blob/master/LICENSE)

A interface distribution plugin for egg.

## Install

``` base
$ npm i egg-bee --save
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
      serviceMap: null, // service map list, a path or object, if no configuration will find service.bee.config.js in baseDir.
      serviceIdent: 'service', // Service identification, That is property name of params.
      app: true // Mount to the app object
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
  // :service is serviceIdent configuration of bee.
  // plugin will match service configuration use ':service'. and add '/*' on the after.
  router.all('/api/:service/*', controller.api.index);
};
```

## Api

### bee.collect(option)

__option:__

- test(res)

A test function of disaster recovery, accept res and return a boolean, if run disaster recovery will useing follow-up service configuration request the server again.

- mixin

A options object, to customize HttpClient.[Details](https://eggjs.org/zh-cn/core/httpclient.html#options-%E5%8F%82%E6%95%B0%E8%AF%A6%E8%A7%A3).

but method and data is always use property of ctx.

### bee.curl(url, option)

just like `ctx.curl`，but the difference is that path will start with "service name".

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


