'use strict';
const Engine = require('../../lib/engine.js');
const BEE = Symbol('Context#bee');

module.exports = {
  get bee() {
    if (!this[BEE]) {
      this[BEE] = Engine(this);
    }
    return this[BEE];
  }
};
