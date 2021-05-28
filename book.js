#!/usr/bin/env node

"use strict";

require('./core/polyfill');

const throttle = require('lodash.throttle');
const api = require('./bitbank/api');
const pri = new api.PrivateAPI('', '');

const term = require('./core/terminal');
const model = require('./core/model');
const products = require('./core/product');

const render_wait = 300;

let product = {};
let health = new model.Health();
let ticker = new model.Ticker();
let book = new model.OrderBook();


const _render = () => {
  const out = process.stdout;

  out.cork();

  out.write(term.clear);
  out.write(term.nl);

  out.write("  Product:".padEnd(20));
  out.write(product.name.padStart(26));
  out.write(term.nl);

  out.write("  Last Price:".padEnd(20));
  out.write(term.colorful(
    term.updown_color(ticker.price, ticker.price_old),
    product.format_price(ticker.price).padStart(26)));
  out.write(term.nl);

  out.write("  Bid/Ask Ratio:".padEnd(20));
  const ratio = book.getBuySellRatio();
  out.write(term.colorful(
    term.updown_color(ratio, 1.0),
    ratio.toFixed(2).padStart(26)));
  out.write(term.nl);

  out.write("  24H Volume:".padEnd(20));
  out.write(product.format_volume(ticker.volume).padStart(26));
  out.write(term.nl);

  out.write(term.separator + term.nl);

  book.getAsks().forEach(row => {
    out.write(product.format_volume(row[1]).padStart(16));
    out.write(" " + term.colorful(
        term.ask_color, product.format_price(row[0]).padStart(12)) + " ");
    out.write("".padEnd(16));
    out.write(term.nl);
  });
  book.getBids().forEach(row => {
    out.write("".padEnd(16));
    out.write(" " + term.colorful(
        term.bid_color, product.format_price(row[0]).padStart(12)) + " ");
    out.write(product.format_volume(row[1]).padStart(16));
    out.write(term.nl);
  });

  out.write(term.separator + term.nl);

  out.write(`  Service) ${health.status}`);
  out.write(term.nl);

  process.nextTick(() => out.uncork());
};
const render = throttle(_render, render_wait);


const main = (program) => {
  product = products.get_product(program.product);
  book.setRowCount(program.row).setGroupingFactor(program.group);

  const check_health = () => {
    pri.call('GET', '/v1/spot/status')
      .then(res => {
        res.data.statuses.forEach(item => {
          if (item.pair === product.code) {
            health.update(item.status);
          }
        })
      })
      .catch(() => health.update('ERROR'))
      .then(() => render());
  }
  check_health();
  setInterval(check_health, 60000);

  new api.RealtimeAPI()
    .bind('message', data => {
      switch (data.room_name) {
        case product.get_depth_channel():
          book.setData(data.message.data);
          break;
        case product.get_ticker_channel():
          ticker.update(data.message.data);
          break;
      }
      render();
    })
    .subscribe(product.get_depth_channel())
    .subscribe(product.get_ticker_channel());
};

process.on("uncaughtException", (err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});

const program = require('commander');
program
  .version(require("./package.json").version)
  .description("Display Bitbank's order book")
  .option("-p, --product <code>", "Currency pair code (default: btc_jpy)", s => s.toLowerCase(), "btc_jpy")
  .option("-r, --row <n>", "Number of display rows (default: 20)", v => parseInt(v), 20)
  .option("-g, --group <n>", "Order grouping unit (default: 0.0)", v => parseFloat(v), 0.0)
  .on("--help", () => {
    console.log("");
    console.log("  Examples:");
    console.log("");
    console.log("    $ node book.js -p btc_jpy -r 32 -g 1000");
    console.log("");
  })
  .parse(process.argv);

main(program);
