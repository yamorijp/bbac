/**
 * bitbank API : Generic Client
 */

"use strict";

const qs = require('qs');
const crypto = require('crypto');
const PubNub = require('pubnub');
const request = require('then-request');
const requestSync = require('sync-request');

const PUBLIC_ENDPOINT = "https://public.bitbank.cc";
const PRIVATE_ENDPOINT = "https://api.bitbank.cc"
const SUBSCRIBE_KEY = "sub-c-e12e9174-dd60-11e6-806b-02ee2ddab7fe";

let debug = false;

const set_debug = b => debug = b;

const decode_json = data => data === "" ? "" : JSON.parse(data);

/**
 * HTTP Public API クライアント
 *
 *     new PublicAPI()
 *         .call("GET", "/v1/getticker", {product_code: "BTC_JPY"})
 *         .then(console.log)
 *         .catch(console.error)
 */
class PublicAPI {

  makeRequest(method, path, params) {
    params = params && Object.keys(params).length ? params : null;
    method = method.toUpperCase();

    if (method == 'GET' && params) path += '?' + qs.stringify(params);
    let body = (method != 'GET' && params) ? JSON.stringify(params) : "";

    let url = PUBLIC_ENDPOINT + path;
    let options = {
      headers: {"Content-Type": "application/json"},
      body: body,
      timeout: 10000,
      socketTimeout: 10000
    };
    return {method: method, url: url, options: options};
  }

  /**
   * リモートAPI呼び出し
   *
   * @param method {string}
   * @param path {string}
   * @param params {object}
   * @returns {Promise}
   */
  call(method, path, params) {
    const req = this.makeRequest(method, path, params);
    if (debug) {
      return Promise.resolve(req);
    } else {
      return request(req.method, req.url, req.options).getBody('utf-8').then(decode_json);
    }
  }

  /**
   * リモートAPI呼び出し (同期)
   * ブロッキング処理につきサーバーでは使用しないこと
   *
   * @param method {string}
   * @param path {string}
   * @param params {object}
   * @return {object}
   */
  callSync(method, path, params) {
    const req = this.makeRequest(method, path, params);
    if (debug) {
      return req;
    } else {
      let res = requestSync(req.method, req.url, req.options);
      return decode_json(res.getBody('utf-8'));
    }
  }
}

/**
 * HTTP Private API クライアント
 *
 *     new PrivateAPI(API_KEY, API_SECRET)
 *         .call("GET", "/v1/me/getchildorders", {product_code: "BTC_JPY"})
 *         .then(console.log)
 *         .catch(console.error)
 */
class PrivateAPI extends PublicAPI {

  constructor(api_key, api_secret) {
    super();
    this.setCredential(api_key, api_secret);
    this.nonce = new Date().getTime();
  }

  /**
   * 認証情報を設定する
   * @param api_key
   * @param api_secret
   */
  setCredential(api_key, api_secret) {
    this.key = api_key;
    this.secret = api_secret;
  }

  signRequest(message) {
    return crypto.createHmac('sha256', this.secret)
      .update(this.nonce.toString() + message).digest('hex');
  }

  makeRequest(method, path, params) {
    this.nonce++;
    params = params && Object.keys(params).length ? params : null;
    method = method.toUpperCase();
    if (params && method == "GET") path = path + "?" + qs.stringify(params);
    const body = params && method != "GET" ? JSON.stringify(params) : "";
    const url = PRIVATE_ENDPOINT + path;
    const options = {
      headers: {
        'ACCESS-KEY': this.key,
        'ACCESS-NONCE': this.nonce.toString(),
        'ACCESS-SIGNATURE': this.signRequest(method == 'GET' ? path : body),
        'Content-Type': 'application/json'
      },
      body: body,
      timeout: 10000,
      socketTimeout: 10000
    };

    return {method: method, url: url, options: options};
  }
}


/**
 * Realtime API クライアント
 *
 *     new RealtimeAPI()
 *         .attach((channel, message) => {
 *             console.log(channel, message);
 *         })
 *         .subscribe(['ticker_btc_jpy']);
 */
class RealtimeAPI {

  constructor(key = SUBSCRIBE_KEY) {
    this.channels = [];
    this.listeners = [];
    this.client = new PubNub({subscribeKey: key});
    this.client.addListener({message: this.onMessage.bind(this)});
  }

  subscribe(channels) {
    if (!Array.isArray(channels)) channels = [channels];
    this.channels = channels;
    this.client.subscribe({channels: channels});
    return this;
  }

  unsubscribe() {
    this.client.unsubscribe(this.channels);
    return this;
  }

  attach(listener) {
    this.listeners.push(listener);
    return this;
  }

  detach(listener) {
    this.listeners = this.listeners.filter(i => i != listener);
    return this;
  }

  onMessage(data) {
    if (!data || !data.message) return;
    this.listeners.forEach(listener => listener(data.channel, data.message));
  }
}

module.exports.PublicAPI = PublicAPI;
module.exports.PrivateAPI = PrivateAPI;
module.exports.RealtimeAPI = RealtimeAPI;
module.exports.set_debug = set_debug;
