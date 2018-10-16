"use strict";

const base = require("./base");

const SIDES = ['buy', 'sell'];
const TYPES = ['limit', 'market'];
const ORDERS = ['asc', 'desc'];


/**
 * GET /usr/assets
 */
class GetAssets extends base.Request {

  constructor() {
    super('GET', '/v1/user/assets', {}, true);
  }
}


/**
 * GET /usr/spot/order
 */
class GetOrder extends base.Request {

  constructor() {
    super('GET', '/v1/user/spot/order', {}, true);
  }

  _validation_schema() {
    return { type: 'object', required: ['pair', 'order_id'] };
  }

  pair(v) {
    this._set('pair', v, {type: 'string'});
    return this;
  }

  order_id(v) {
    this._set('order_id', v, {type: 'number'});
    return this;
  }
}


/**
 * POST /usr/spot/order
 */
class PostOrder extends base.Request {

  constructor() {
    super('POST', '/v1/user/spot/order', {type: 'limit'}, true);
  }

  _validation_schema() {
    return { type: 'object', required: ['pair', 'amount', 'side', 'type'] };
  }

  pair(v) {
    this._set('pair', v, {type: 'string'});
    return this;
  }

  amount(v) {
    this._set('amount', v, {type: 'number'});
    return this;
  }

  price(v) {
    this._set('price', v, {type: 'number'});
    return this;
  }

  side(v) {
    this._set('side', base.lower(v), {'enum': SIDES});
    return this;
  }

  type(v) {
    this._set('type', base.lower(v), {'enum': TYPES});
  }
}


/**
 * POST /user/spot/cancel_order
 */
class PostCancelOrder extends base.Request {

  constructor() {
    super('POST', '/v1/user/spot/cancel_orders', {}, true);
  }

  _validation_schema() {
    return { type: 'object', required: ['pair', 'order_id'] };
  }

  pair(v) {
    this._set('pair', v, {type: 'string'});
    return this;
  }

  order_id(v) {
    this._set('order_id', v, {type: 'number'});
    return this;
  }
}


/**
 * POST /user/spot/cancel_orders
 */
class PostCancelOrders extends base.Request {

  constructor() {
    super('POST', '/v1/user/spot/cancel_orders', {}, true);
  }

  _validation_schema() {
    return { type: 'object', required: ['pair', 'order_ids'] };
  }

  pair(v) {
    this._set('pair', v, {type: 'string'});
    return this;
  }

  order_ids(v) {
    this._set('order_ids', v, {type: 'array', items: {type: 'number'}});
    return this;
  }
}


/**
 * POST /user/spot/orders_info
 */
class PostOrdersInfo extends base.Request {

  constructor() {
    super('POST', '/v1/user/spot/orders_info', {}, true);
  }

  _validation_schema() {
    return { type: 'object', required: ['pair', 'order_ids'] };
  }

  pair(v) {
    this._set('pair', v, {type: 'string'});
    return this;
  }

  order_ids(v) {
    this._set('order_ids', v, {type: 'array', items: {type: 'number'}});
    return this;
  }
}


/**
 * POST /user/spot/active_orders
 */
class GetActiveOrders extends base.Request {

  constructor() {
    super('GET', '/v1/user/spot/active_orders', {}, true);
  }

  _validation_schema() {
    return { type: 'object', required: ['pair'] };
  }

  pair(v) {
    this._set('pair', v, {type: 'string'});
    return this;
  }

  count(v) {
    this._set('count', v, {type: 'number'});
    return this;
  }

  from_id(v) {
    this._set('from_id', v, {type: 'number'});
    return this;
  }

  end_id(v) {
    this._set('end_id', v, {type: 'number'});
    return this;
  }

  since(v) {
    this._set('since', v, {type: 'number'});
    return this;
  }

  end(v) {
    this._set('end', v, {type: 'number'});
    return this;
  }
}


/**
 * GET /user/spot/active_orders
 */
class GetTradeHistory extends base.Request {

  constructor() {
    super('GET', '/v1/user/spot/trade_history', {}, true);
  }

  _validation_schema() {
    return { type: 'object', required: ['pair'] };
  }

  pair(v) {
    this._set('pair', v, {type: 'string'});
    return this;
  }

  count(v) {
    this._set('count', v, {type: 'number'});
    return this;
  }

  order_id(v) {
    this._set('order_id', v, {type: 'number'});
    return this;
  }

  since(v) {
    this._set('since', v, {type: 'number'});
    return this;
  }

  end(v) {
    this._set('end', v, {type: 'number'});
    return this;
  }

  order(v) {
    this._set('order', base.lower(v), {'enum': ORDERS});
    return this;
  }
}


/**
 * GET /user/withdrawal_account
 */
class GetWithdrawalAccount extends base.Request {

  constructor() {
    super('GET', '/v1/user/withdrawal_account', {}, true);
  }

  _validation_schema() {
    return { type: 'object', required: ['asset'] };
  }

  asset(v) {
    this._set('asset', v, {type: 'string'});
    return this;
  }
}


/**
 * POST /user/request_withdrawal
 */
class PostRequestWithdrawal extends base.Request {

  constructor() {
    super('POST', '/v1/user/request_withdrawal', {}, true);
  }

  _validation_schema() {
    return { type: 'object', required: ['asset', 'uuid', 'amount'] };
  }

  asset(v) {
    this._set('asset', v, {type: 'string'});
    return this;
  }

  uuid(v) {
    this._set('uuid', v, {type: 'string'});
    return this;
  }

  amount(v) {
    this._set('amount', v.toString(), {type: 'string'});
    return this;
  }

  otp_token(v) {
    this._set('otp_token', v, {type: 'string'});
    return this;
  }

  sms_token(v) {
    this._set('sms_token', v, {type: 'string'});
    return this;
  }
}


/**
 * GET /spot/status
 */
class GetStatus extends base.Request {

  constructor() {
    super('GET', '/v1/spot/status', {}, true);
  }
}


module.exports.get_assets = GetAssets;
module.exports.get_order = GetOrder;
module.exports.post_order = PostOrder;
module.exports.post_cancel_order = PostCancelOrder;
module.exports.post_cancel_orders = PostCancelOrders;
module.exports.post_orders_info = PostOrdersInfo;
module.exports.get_active_orders = GetActiveOrders;
module.exports.get_trade_history = GetTradeHistory;
module.exports.get_withdrawal_account = GetWithdrawalAccount;
module.exports.post_request_withdrawal = PostRequestWithdrawal;
module.exports.get_status = GetStatus;
module.exports.set_credential = base.set_credential;
module.exports.get_credential = base.get_credential;
module.exports.clear_credential = base.clear_credential;

