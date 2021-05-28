"use strict";

const api = require('../bitbank/api');

const PAIRS = {
  // price_fmt, volume_fmt
  'btc_jpy': [0, 4],
  'xrp_jpy': [3, 4],
  'ltc_btc': [8, 4],
  'eth_btc': [8, 4],
  'mona_jpy': [3, 4],
  'mona_btc': [8, 4],
  'bcc_jpy': [0, 4],
  'bcc_btc': [8, 4]
};

class Product {

  constructor(name, code, price_formatter, volume_formatter) {
    this.name = name;
    this.code = code;
    this.price_formatter = price_formatter;
    this.volume_formatter = volume_formatter;
  }

  format_price(n) {
    return this.price_formatter(n);
  }

  format_volume(n) {
    return this.volume_formatter(n);
  }

  get_ticker_channel() {
    return 'ticker_' + this.code;
  }

  get_depth_channel() {
    return 'depth_whole_' + this.code;
  }

  get_depth_diff_channel() {
    return 'depth_diff_' + this.code;
  }

  get_transactions_channel() {
    return 'transactions_' + this.code;
  }

  get_candlestick_channel() {
    return 'candlestick_' + this.code;
  }
}

class InvalidProductCodeError {

  constructor(product_code) {
    this.name = 'InvalidProductCodeError';
    this.product_code = product_code;
    this.message = `"${product_code}" isn't supported.`;
  }
}

const fixed_formatter = (digit) => {
  return (n) => n.toFixed(digit);
};


const find_pair = (code) => {
  if (code in PAIRS)
    return ([code].concat(PAIRS[code]));
  const resp = new api.PrivateAPI('', '').callSync("GET", "/v1/spot/status", {});
  const pairs = resp.data.statuses.map(item => item.pair);
  if (pairs.indexOf(code) !== -1) {
    return [code, 8, 4];
  } else {
    return null;
  }
};

const get_product = (code) => {
  code = code.toLowerCase();
  const pair = find_pair(code);
  if (pair) {
    return new Product(
      "bitbank " + pair[0].replace(/_/g, "").toUpperCase(),
      pair[0],
      fixed_formatter(pair[1]),
      fixed_formatter(pair[2])
    );
  }
  throw new InvalidProductCodeError(code);
};

module.exports.get_product = get_product;
module.exports.InvalidProductCodeError = InvalidProductCodeError;
