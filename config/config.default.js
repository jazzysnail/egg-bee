'use strict';

const path = require('path');

module.exports = () => {
  const config = {};

  config.bee = {
    serviceMap: null,
    serviceIdent: 'service',
    app: true
  };

  return config;
};
