'use strict';
const Engine = require('../../lib/engine.js');
const BEE = Symbol('Context#bee');

module.exports = {

  get bee() {
    if (!this[BEE]) {
      // console.log(Engine(this);)
      this[BEE] = Engine(this);
      // this[BEE] = {hehe: 'hehe'}
    }
    return this[BEE];
  },
};
