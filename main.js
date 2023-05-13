require('dotenv').config();
const { ethers } = require('ethers');
const { Telegraf, Markup } = require('telegraf');
const botActions = require('./components/botActions');
const listenerBSC = require('./networks/BSC.js');
const listenerBSCT = require('./networks/BSCt.js');
const listenerETH = require('./networks/ETH.js');
const listenerGFD = require('./networks/GFD.js');
const { addAddress, removeAddress, resetAddresses, listAddresses } = require('./components/addHandler.js');

const botToken = process.env.BOT_KEY;
const bot = new Telegraf(botToken);
let walletsToMonitor = {};

bot.start((ctx) => {
  ctx.reply(
    'Listening networks:',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('BSC', 'CHANGE_RPC_BSC'),
        Markup.button.callback('ETH', 'CHANGE_RPC_ETH'),
        Markup.button.callback('BSCt', 'CHANGE_RPC_BSCT'),
        Markup.button.callback('GFD', 'CHANGE_RPC_GFD'),
      ],
      [
        // Be updated with functions
        Markup.button.callback('ARB', 'xxx'),
        Markup.button.callback('MATIC', 'xxx'),
        Markup.button.callback('AVAX', 'xxx'),
        Markup.button.callback('APT', 'xxx'),
      ],
      [
        Markup.button.callback('Add new EVM network', 'xxx'),
      ]
    ])
  );
});

// Define walletsToMonitor at an appropriate place in your code
bot.on('text', (ctx) => {
  const input = ctx.message.text.trim().split(" ");
  const command = input[0].toLowerCase();
  const address = input[1];

  if (address && !isValidAddress(address)) {
    return ctx.reply('Invalid address. Please send a valid smart contract address.');
  }

  const commands = {
    "add": addAddress,
    "remove": removeAddress,
    "reset": resetAddresses,
    "list": listAddresses
  };

  if (commands[command]) {
    commands[command](ctx, address, walletsToMonitor); // Pass walletsToMonitor here
  } else {
    ctx.reply('Invalid command. Use "add", "remove", "reset", or "list" followed by the address (if required).');
  }
});

function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function sendMessage(chatId, message) {
  try {
    await bot.telegram.sendMessage(chatId, message);
  } catch (error) {
    console.error(`Failed to send message: ${error}`);
  }
}

function getWalletsToMonitor() {
  return walletsToMonitor;
}

bot.launch();
botActions(bot, ethers, listenerBSC, listenerBSCT, listenerETH, listenerGFD, getWalletsToMonitor, sendMessage);
console.log("Bot is running...")

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));