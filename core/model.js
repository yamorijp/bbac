"use strict";

class OrderBook {

  constructor() {
    this.bids = new Map();
    this.asks = new Map();
    this.factor = 0.0;
    this.size = 24;
  }

  setGroupingFactor(n) {
    this.factor = n;
    return this;
  }

  setRowCount(n) {
    this.size = n;
    return this;
  }

  setData(data) {
    this.bids.clear();
    data.bids.forEach(row => this.bids.set(parseFloat(row[0]), parseFloat(row[1])));
    this.asks.clear();
    data.asks.forEach(row => this.asks.set(parseFloat(row[0]), parseFloat(row[1])));
    return this;
  }

  _grouping(data, factor, func) {
    let groups = new Map();
    data.forEach((size, price) => {
      let group = func(price / factor) * factor;
      groups.set(group, (groups.get(group) || 0.0) + size);
    });
    return groups;
  }

  getBids() {
    let rows = this.factor === 0.0 ? this.bids : this._grouping(this.bids, this.factor, Math.floor);
    return Array.from(rows.keys())
      .sort((a, b) => b - a)
      .slice(0, this.size)
      .map(price => [price, rows.get(price)])
  }

  getAsks() {
    let rows = this.factor === 0.0 ? this.asks : this._grouping(this.asks, this.factor, Math.ceil);
    return Array.from(rows.keys())
      .sort((a, b) => b - a)
      .slice(-this.size)
      .map(price => [price, rows.get(price)])
  }

  getBuySellRatio() {
    const bid_volume = Array.from(this.bids.values()).reduce((x, y) => x + y, 0);
    const ask_volume = Array.from(this.asks.values()).reduce((x, y) => x + y, 0);
    return bid_volume / ask_volume;
  }
}


class ExecutionBuffer {

  constructor() {
    this.capacity = 48;
    this.data = new Map();
  }

  setCapacity(n) {
    this.capacity = n;
    return this;
  }

  size() {
    return this.data.size;
  }

  _toEntity(row) {
    return {
      id: row.transaction_id,
      time: new Date(row.executed_at),
      side: row.side.toUpperCase(),
      price: parseFloat(row.price),
      size: parseFloat(row.amount),
    };
  }

  stats() {
    let buy_volume = Array.from(this.data.values())
      .filter(row => row.side === 'BUY')
      .reduce((prev, curr) => prev + curr.size, 0.0);
    let sell_volume = Array.from(this.data.values())
      .filter(row => row.side === 'SELL')
      .reduce((prev, curr) => prev + curr.size, 0.0);
    let ratio = buy_volume / sell_volume;
    return {
      buy_volume: buy_volume,
      sell_volume: sell_volume,
      ratio: ratio
    };
  }

  addAll(items) {
    items.forEach(item => this.add(item));
    return this;
  }

  add(item) {
    const entry = this._toEntity(item)
    this.data.set(entry.id, entry)
    if (this.data.size > this.capacity) {
      const k = Array.from(this.data.keys())
        .reduce((x, y) => Math.min(x, y));
      this.data.delete(k)
    }
    return this;
  }

  all() {
    return Array.from(this.data.keys())
      .sort((a, b) => a - b)
      .reverse()
      .map(key => this.data.get(key));
  }
}


class Ticker {

  constructor() {
    this.price = 0.0;
    this.price_old = 0.0;
    this.volume = 0.0;
    this.buy = 0.0;
    this.sell = 0.0;
    this.high = 0.0;
    this.low = 0.0;
  }

  update(data) {
    this.price_old = this.price;
    this.price = parseFloat(data.last);
    this.volume = parseFloat(data.vol);
    this.buy = parseFloat(data.buy);
    this.sell = parseFloat(data.sell);
    this.high = parseFloat(data.high);
    this.low = parseFloat(data.low);
    return this;
  }
}


class TickerBoard {

  constructor(products) {
    this.data = new Map();
    products.forEach((v, k) => this.data.set(k, new Ticker()));
  }

  update(id, data) {
    if (this.data.has(id))
      this.data.get(id).update(data);
  }

  get(id) {
    return this.data.get(id);
  }
}


class Health {

  constructor() {
    this.status = "";
  }

  update(status) {
    this.status = status;
    return this;
  }
}


module.exports.OrderBook = OrderBook;
module.exports.ExecutionBuffer = ExecutionBuffer;
module.exports.Ticker = Ticker;
module.exports.TickerBoard = TickerBoard;
module.exports.Health = Health;
