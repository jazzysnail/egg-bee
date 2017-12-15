'use strict';

const Bee = require('./bee');
module.exports = ctx => {
  return new Bee(ctx)
};
