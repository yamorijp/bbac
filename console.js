#!/usr/bin/env node

"use strict";

require('./core/polyfill');

const repl = require('repl');

const term = require('./core/terminal');
const command = require('./core/command');

const api = require('./bitbank/api');
const pub = require('./bitbank/builder/pub');
const pri = require('./bitbank/builder/pri');

const version = require('./package.json').version;
const banner = `${term.yellow}${term.bold}
   _     _ 
  | |__ | |__   __ _  ___ 
  | '_ \\| '_ \\ / _\` |/ __|
  | |_) | |_) | (_| | (__ 
  |_.__/|_.__/ \\__,_|\\___|

${term.reset}${term.yellow}
  bitbank - api - console
${term.reset}

  コンテキスト変数:
    api      -> APIクライアント
    pub      -> パブリックAPI
    pri      -> プライベートAPIと認証

  コマンド:
    .help または .bb_* help を参照
    > .bb_buy help

  APIドキュメント:
    bitbank.cc API - https://docs.bitbank.cc/

  例:
    > pri.set_credential(YOUR_API_ID, YOUR_API_SECRET)
    > pri.get_active_orders.create()
    > _.pair("btc_jpy")
    > _.executeSync()


`;

const loadCredential = () => {
  try {
    const config = require('./.credential.json');
    if (config.api_key && config.api_secret) {
      pri.set_credential(config.api_key, config.api_secret);
      console.log(term.colorful(term.green, "  (.credential.json loaded)\n\n"));
    }
  } catch (e) {
    // not found
  }
};

const initContext = (context) => {
  context.api = api;
  context.pub = pub;
  context.pri = pri;
};


const main = (program) => {
  if (!program.nobanner) {
    process.stdout.write(term.clear);
    process.stdout.write(term.nl);
    process.stdout.write(banner);
  }

  loadCredential();

  const server = repl.start('> ');

  initContext(server.context);
  server.on('reset', initContext);

  Object.values(command.commands)
    .forEach(cmd => server.defineCommand(cmd.getName(), {
      help: cmd.getHelp(),
      action(arg) {
        cmd.doAction(server, arg);
      }
    }));
};


const program = require('commander');
program
  .version(require("./package.json").version)
  .description("bitbank - api - console")
  .option("-n, --no-banner", "Don't show ugly startup banner", false)
  .on("--help", () => {
    console.log("");
    console.log("  Examples:");
    console.log("");
    console.log("    $ node console.js -n");
    console.log("");
  })
  .parse(process.argv);

main(program);
