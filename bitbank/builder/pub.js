"use strict";

const base = require("./base");

const CANDLE_TYPES = [
  '1min', '5min', '15min', '30min',
  '1hour', '4hour', '8hour', '12hour',
  '1day', '1week'
]


/**
 * GET /{pair}/ticker
 */
class Ticker extends base.Request {

  constructor() {
    super('GET', '/:pair/ticker', {}, false);
  }

  _validation_schema() {
    return { type: 'object', required: [':pair'] };
  }

  pair(v) {
    this._set(':pair', v, {type: 'string'});
    return this;
  }
}


/**
 * GET /{pair}/depth
 */
class Depth extends base.Request {

  constructor() {
    super('GET', '/:pair/depth', {}, false);
  }

  _validation_schema() {
    return { type: 'object', required: [':pair'] };
  }

  pair(v) {
    this._set(':pair', v, {type: 'string'});
    return this;
  }
}


/**
 * GET /{pair}/transactions
 */
class Transaction extends base.Request {

  constructor() {
    super('GET', '/:pair/transactions', {}, false);
  }

  _validation_schema() {
    return { type: 'object', required: [':pair'] };
  }

  pair(v) {
    this._set(':pair', v, {type: 'string'});
    return this;
  }
}


/**
 * GET /{pair}/transactions/{yyyymmdd}
 */
class TransactionYmd extends base.Request {

  constructor() {
    super('GET', '/:pair/transactions/:yyyymmdd')
  }

  _validation_schema() {
    return { type: 'object', required: [':pair'] };
  }

  pair(v) {
    this._set(':pair', v, {type: 'string'});
    return this;
  }

  yyyymmdd(v) {
    this._set(':yyyymmdd', v.toString(), {pattern: /^\d{6}$/})
    return this
  }
}


/**
 * GET /{pair}/candlestick/{candle-type}/{yyyy}
 */
class Candlestick extends base.Request {

  constructor() {
    super('GET', '/:pair/transactions/:candle_type/:yyyy', {}, false);
  }

  _validation_schema() {
    return { type: 'object', required: [':pair', ':candle_type', ':yyyy'] };
  }

  pair(v) {
    this._set(':pair', v, {type: 'string'});
    return this;
  }

  candle_type(v) {
    this._set(":candle_type", base.lower(v), {"enum": CANDLE_TYPES});
    return this;
  }

  yyyy(v) {
    this._set(':yyyy', v.toString(), {type: 'string', pattern: /^\d{4}(\d{2})?$/});
    return this;
  }
}

module.exports.ticker = Ticker;
module.exports.depth = Depth;
module.exports.transaction = Transaction;
module.exports.transaction_ymd = TransactionYmd;
module.exports.candlestick = Candlestick;
