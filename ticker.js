#!/usr/bin/env node

"use strict";

require('./core/polyfill');

const throttle = require('lodash.throttle');
const api = require('./bitbank/api');
const pub = new api.PublicAPI();

const term = require('./core/terminal');
const model = require('./core/model');
const products = require('./core/product');

const render_wait = 200;

let product_map = new Map();
let tickers = null;


const _render = () => {
  const out = process.stdout;

  out.write(term.clear);
  out.write(term.nl);

  out.write("  Exchange:".padEnd(20));
  out.write("bitbank Exchange".padStart(26));
  out.write(term.nl);

  out.write("  Last Update:".padEnd(20));
  out.write(new Date().toLocaleTimeString().padStart(26));
  out.write(term.nl);

  out.write(term.nl);

  out.write("  " + "Code".padEnd(10));
  out.write(" " + "Price".padStart(15));
  out.write(" " + "Volume".padStart(17));
  out.write(term.nl);

  out.write(term.separator + term.nl);

  product_map.forEach((p, id) => {
    const data = tickers.get(id);
    out.write("  " + p.code.toUpperCase().padEnd(10));
    out.write(" " + term.colorful(
        term.updown_color(data.price, data.price_old),
        p.format_price(data.price).padStart(15)));
    out.write(" " + p.format_volume(data.volume).padStart(17));
    out.write(term.nl);
  });

  out.write(term.separator + term.nl);
  out.write(term.nl);
};
const render = throttle(_render, render_wait);


const main = (program) => {
  program.product
    .split(",").filter(s => s.trim())
    .forEach(s => {
      const p = products.get_product(s);
      product_map.set(p.get_ticker_channel(), p);
    });

  tickers = new model.TickerBoard(product_map);

  const ws = new api.RealtimeAPI()
    .attach((ch, message) => {
      tickers.update(ch, message.data);
      render();
    });

  Array.from(product_map.values()).forEach(p => {
    pub.call('GET', '/' + p.code + '/ticker', {})
      .then(resp => {
        const ch = p.get_ticker_channel();
        tickers.update(ch, resp.data);
        ws.subscribe(ch);
        render();
      })
  });
};

process.on("uncaughtException", (err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});

const program = require('commander');
program
  .version(require("./package.json").version)
  .description("Display Bitbank's ticker")
  .option("-p, --product <code>",
    "Currency pair codes, comma separated (default: btc_jpy,xrp_jpy,mona_jpy,bcc_jpy,eth_btc,ltc_btc)",
    s => s.toLowerCase(),
    "btc_jpy,xrp_jpy,mona_jpy,bcc_jpy,eth_btc,ltc_btc")
  .on("--help", () => {
    console.log("");
    console.log("  Examples:");
    console.log("");
    console.log("    $ node ticker.js -p btc_jpy,xrp_jpy");
    console.log("");
  })
  .parse(process.argv);

main(program);

