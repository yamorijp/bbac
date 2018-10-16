"use strict";

const term = require('./terminal');
const product = require('./product');

const pub = require('../bitbank/builder/pub');
const pri = require('../bitbank/builder/pri');

const to_float = (s) => {
  let f = parseFloat(s);
  if (isNaN(f)) throw new Error("Error: could not convert string to number");
  return f;
};

const pass = (s) => s;
const lower = (s) => s.toLowerCase();

const price_or_market = (s) => s.toUpperCase() === 'MARKET' ? 'MARKET' : to_float(s);

const order = (side, argv) => {
  const order = new pri.post_order()
    .side(side)
    .pair(argv[0])
    .amount(argv[2]);

  if (argv[1] === 'MARKET') {
    order.price(argv[1])
    order.type('limit')
  } else {
    order.type('market')
  }

  return order;
}


class Command {
  constructor(name) {
    this._name = name;
    this._description = "";
    this._requireArgs = [];
    this._optionalArgs = [];
    this._action = () => {
    };
  }

  getName() {
    return this._name;
  }

  description(text) {
    this._description = text;
    return this;
  }

  getHelp() {
    return this._description;
  }

  getFullHelp() {
    return "\n    " + this._description + "\n" + this.getUsage();
  }

  requireArg(name, help, apply) {
    this._requireArgs.push({name: name, help: help, apply: apply});
    return this;
  }

  optionalArg(name, help, apply, defaultValue) {
    this._optionalArgs.push({name: name, help: help, apply: apply, _: defaultValue});
    return this;
  }

  action(func) {
    this._action = func;
    return this;
  }

  getUsage() {
    let usage = "\n    Usage: ." + this._name + " " +
      this._requireArgs.map(rule => "<" + rule.name + ">").join(" ") + " " +
      this._optionalArgs.map(rule => "[" + rule.name + "]").join(" ") + "\n";

    if (this._requireArgs.length || this._optionalArgs.length) {
      usage += "\n" + this.getUsageArgs() + "\n";
    }
    return usage;
  }

  getUsageArgs() {
    return [].concat(
      this._requireArgs.map(rule => `    <${rule.name}> ${rule.help}`),
      this._optionalArgs.map(rule => `    [${rule.name}] ${rule.help}`)
    ).join("\n");
  }

  parseArg(arg) {
    let argv = typeof arg === 'string' ? arg.trim().split(" ").filter(Boolean) : [];
    if (argv.length < this._requireArgs.length) throw new Error("Error: one or more arguments are required");

    return [].concat(
      this._requireArgs
        .map(rule => rule.apply(argv.shift())),
      this._optionalArgs
        .map(rule => argv.length ? rule.apply(argv.shift()) : rule._),
      argv
    );
  }

  doAction(context, arg) {
    if (arg === "help") {
      console.log(this.getFullHelp());
    } else {
      try {
        let argv = this.parseArg(arg);
        try {
          const data = this._action(argv);
          console.dir(data, {depth: 5});
        } catch (e) {
          console.error(term.colorful(term.yellow, e.message));
        }
      } catch (e) { // parse error
        console.error(term.colorful(term.yellow, e.message));
        console.log(this.getUsage());
      }
    }
    context.displayPrompt();
  }
}

module.exports.Command = Command;
module.exports.commands = {};

module.exports.commands.cls = new Command("bb_cls")
  .description("表示をクリアします")
  .action(argv => {
    return term.clear;
  });

module.exports.commands.set_key = new Command("bb_set_key")
  .description("API keyとAPI secretを登録します")
  .requireArg("api_key", "API key", pass)
  .requireArg("api_secret", "API secret", pass)
  .action(argv => {
    const pattern = /^[A-Za-z0-9/-]+$/;
    if (argv[0].match(pattern) && argv[1].match(pattern)) {
      pri.set_credential(argv[0], argv[1]);
      return "ok";
    } else {
      throw new Error("Error: API key and secret are invalid");
    }
  });

module.exports.commands.store_key = new Command("bb_store_key")
  .description("登録中のAPI keyとAPI secretをファイルに書き出します")
  .action(argv => {
    const c = pri.get_credential();
    if (c.api_key && c.api_secret) {
      require('fs').writeFileSync(
        ".credential.json", JSON.stringify(c), {mode: 384 /*0o600*/});
      return "'.credential.json' created";
    } else {
      throw new Error("Error: API key and API secret are null");
    }
  });

module.exports.commands.balance = new Command('bb_balance')
  .description('保有資産の一覧を表示します *')
  .action(argv => {
    return new pri.get_assets()
      .executeSync();
  });

module.exports.commands.price = new Command('bb_price')
  .description('通貨ペアの取引価格を表示します')
  .requireArg('pair', '通貨ペア', lower)
  .action(argv => {
    return new pub.ticker()
      .pair(product.get_product(argv[0]).code)
      .executeSync();
  });

module.exports.commands.orders = new Command('bb_orders')
  .description('アクティブな注文を最大10件表示します *')
  .requireArg('pair', '通貨ペア', lower)
  .optionalArg('count', '取得する注文数', parseInt, 10)
  .action(argv => {
    return new pri.get_active_orders()
      .pair(product.get_product(argv[0]).code)
      .count(argv[1])
      .executeSync();
  });

module.exports.commands.histories = new Command('bb_histories')
  .description('約定履歴を最大10件表示します *')
  .requireArg('pair', '通貨ペア', lower)
  .optionalArg('count', '取得する約定数', parseInt, 10)
  .action(argv => {
    return new pri.get_trade_history()
      .pair(product.get_product(argv[0]).code)
      .count(argv[1])
      .executeSync();
  });

module.exports.commands.buy = new Command('bb_buy')
  .description('買い注文を発行します *')
  .requireArg('pair', '通貨ペア', lower)
  .requireArg('price', "価格 (成行の場合は'MARKET'を指定)", price_or_market)
  .requireArg('amount', '数量', to_float)
  .action(argv => {
    return order('buy', argv)
      .executeSync();
  });

module.exports.commands.sell = new Command('bb_sell')
  .description('売り注文を発行します *')
  .requireArg('pair', '通貨ペア', lower)
  .requireArg('price', "価格 (成行の場合は'MARKET'を指定)", price_or_market)
  .requireArg('amount', '数量', to_float)
  .action(argv => {
    return order('sell', argv)
      .executeSync();
  });

module.exports.commands.cancel = new Command('bb_cancel')
  .description('注文をキャンセルします *')
  .requireArg('pair', '通貨ペア', lower)
  .requireArg('order_id', '注文ID', parseInt)
  .action(argv => {
    return new pri.post_cancel_order()
      .pair(argv[0])
      .order_id(argv[1])
      .executeSync()
      .data;
  })

