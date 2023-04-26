require('dotenv').config();
const { ethers } = require('ethers');
const { Telegraf, Markup } = require('telegraf');
const listenerBSC = require('./networks/listener_bsc.js');
const listenerBSCT = require('./networks/listener_bsct.js');
const listenerETH = require('./networks/listener_eth.js');

const botToken = process.env.BOT_KEY;
const bot = new Telegraf(botToken);
let listening = true;
let currentListener;

bot.start((ctx) => {
  ctx.reply(
    'Select the network:',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('BSC', 'CHANGE_RPC_BSC'),
        Markup.button.callback('ETH', 'CHANGE_RPC_ETH'),
      ],
      [
        Markup.button.callback('BSC Testnet', 'CHANGE_RPC_BSCT'), // Added this line for the BSC Testnet button
      ],
    ])
  );
});

bot.action("CHANGE_RPC_BSC", async (ctx) => {
  process.env.BSCT_RPC_ENDPOINT = process.env.BSC_RPC_ENDPOINT;
  ctx.answerCbQuery("Switched to BSC network");
  ctx.reply('Use "add", "remove", "reset", or "list" followed by the address (if required).');
  listening = false;
  setTimeout(async () => {
    listening = true;
    const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_ENDPOINT);
    if (currentListener) {
      currentListener.stop();
    }
    currentListener = await listenerBSC(getWalletsToMonitor, (chatId, msg) => sendMessage(chatId, msg), listening, provider);
  }, 1000);
});

bot.action("CHANGE_RPC_BSCT", async (ctx) => {
  process.env.BSCT_RPC_ENDPOINT = process.env.BSCT_RPC_ENDPOINT;
  ctx.answerCbQuery("Switched to BSC test network");
  ctx.reply('Use "add", "remove", "reset", or "list" followed by the address (if required).');
  listening = false;
  setTimeout(async () => {
    listening = true;
    const provider = new ethers.providers.JsonRpcProvider(process.env.BSCT_RPC_ENDPOINT);
    if (currentListener) {
      currentListener.stop();
    }
    currentListener = await listenerBSCT(getWalletsToMonitor, (chatId, msg) => sendMessage(chatId, msg), listening, provider);
  }, 1000);
});

bot.action("CHANGE_RPC_ETH", async (ctx) => {
  process.env.ETH_RPC_ENDPOINT = process.env.ETH_RPC_ENDPOINT;
  ctx.answerCbQuery("Switched to ETH network");
  ctx.reply('Use "add", "remove", "reset", or "list" followed by the address (if required).');
  listening = false;
  setTimeout(async () => {
    listening = true;
    const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_ENDPOINT);
    if (currentListener) {
      currentListener.stop();
    }
    currentListener = await listenerETH(getWalletsToMonitor, (chatId, msg) => sendMessage(chatId, msg), listening, provider);
  }, 1000);
});

let walletsToMonitor = {};

bot.on('text', (ctx) => {
  const chatId = ctx.chat.id;
  const input = ctx.message.text.trim();
  const command = input.split(" ")[0].toLowerCase();
  const address = input.split(" ")[1];

  if (command === "add" && address) {
    if (isValidAddress(address)) {
      if (!walletsToMonitor[chatId]) {
        walletsToMonitor[chatId] = [];
      }
      if (!walletsToMonitor[chatId].includes(address)) {
        walletsToMonitor[chatId].push(address);
        ctx.reply(`Added wallet to monitor: ${address}`);
      } else {
        ctx.reply('This wallet is already being monitored.');
      }
    } else {
      ctx.reply('Invalid address. Please send a valid smart contract address.');
    }
  }
  else if (command === "remove" && address) {
    if (walletsToMonitor[chatId] && walletsToMonitor[chatId].includes(address)) {
      walletsToMonitor[chatId] = walletsToMonitor[chatId].filter(wallet => wallet !== address);
      ctx.reply(`Removed wallet from monitoring: ${address}`);
    } else {
      ctx.reply('Address not found in monitored wallets list.');
    }
  } 
  else if (command === "reset") {
    walletsToMonitor[chatId] = [];
    ctx.reply('All wallets have been removed from monitoring.');
  } 
  else if (command === "list") {
    const userWallets = walletsToMonitor[chatId] || [];
    if (userWallets.length > 0) {
      const walletList = userWallets.join('\n');
      ctx.reply(`Monitored wallets:\n${walletList}`);
    } else {
      ctx.reply('No wallets are currently being monitored.');
    }
  } 
  else {
    ctx.reply('Invalid command. Use "add", "remove", "reset", or "list" followed by the address (if required).');
  }
});

function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function sendMessage(chatId, message) {
  await bot.telegram.sendMessage(chatId, message);
}

function getWalletsToMonitor() {
  return walletsToMonitor;
}

bot.launch();
console.log("Bot is running...")

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));