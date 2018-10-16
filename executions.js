#!/usr/bin/env node

"use strict";

require('./core/polyfill');

const throttle = require('lodash.throttle');

const term = require('./core/terminal');
const api = require('./bitbank/api');
const model = require('./core/model');
const products = require('./core/product');

const render_wait = 200;

let product = null;
let buffer = new model.ExecutionBuffer();


const _render = () => {
  const out = process.stdout;

  out.write(term.clear);
  out.write(term.nl);

  out.write("  Product:".padEnd(20));
  out.write(product.name.padStart(26));
  out.write(term.nl);

  const stats = buffer.stats();
  out.write("  Buy:".padEnd(20));
  out.write(term.colorful(
    term.bid_color, product.format_volume(stats.buy_volume).padStart(26)));
  out.write(term.nl);

  out.write("  Sell:".padEnd(20));
  out.write(term.colorful(
    term.ask_color, product.format_volume(stats.sell_volume).padStart(26)));
  out.write(term.nl);

  out.write("  Buy/Sell Ratio:".padEnd(20));
  out.write(term.colorful(
    term.updown_color(stats.ratio, 1.0), stats.ratio.toFixed(2).padStart(26)));
  out.write(term.nl);

  out.write(term.separator + term.nl);

  buffer.all().forEach(row => {
    out.write("  ");
    out.write(row.time.toLocaleTimeString().padEnd(14));
    out.write(term.colorful(
      row.side === 'BUY' ? term.bid_color : term.ask_color,
      row.side.padEnd(4) + product.format_price(row.price).padStart(10)));
    out.write(product.format_volume(row.size).padStart(16));
    out.write(term.nl);
  });

  out.write(term.separator + term.nl);
  out.write(term.nl);
};
const render = throttle(_render, render_wait);


const main = (program) => {
  product = products.get_product(program.product);
  buffer.setCapacity(program.row);

  new api.PublicAPI()
    .call('GET', '/' + product.code + '/transactions', {})
    .then(data => {
      buffer.addAll(data.data.transactions);
      render();
    });

  new api.RealtimeAPI()
    .subscribe(product.get_transactions_channel())
    .attach((ch, message) => {
      buffer.addAll(message.data.transactions);
      render();
    });
};

process.on("uncaughtException", (err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});

const program = require('commander');
program
  .version(require('./package.json').version)
  .description("Display Bitbank's execution history")
  .option("-p, --product <code>", "Currency pair code (default: btc_jpy)",
    s => s.toUpperCase(), "btc_jpy")
  .option("-r, --row <n>", "Number of display rows (default: 40)", v => parseInt(v), 40)
  .on("--help", () => {
    console.log("");
    console.log("  Examples:");
    console.log("");
    console.log("    $ node executions.js -p btc_jpy -r 20");
    console.log("");
  })
  .parse(process.argv || process.argv);

main(program);
