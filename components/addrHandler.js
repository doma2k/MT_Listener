exports.addAddress = (ctx, address, walletsToMonitor) => {
  const chatId = ctx.chat.id;
  walletsToMonitor[chatId] = walletsToMonitor[chatId] || [];
  if (!walletsToMonitor[chatId].includes(address)) {
    walletsToMonitor[chatId].push(address);
    ctx.reply(`Added wallet to monitor: ${address}`);
  } else {
    ctx.reply('This wallet is already being monitored.');
  }
};

exports.removeAddress = (ctx, address, walletsToMonitor) => {
  const chatId = ctx.chat.id;
  if (walletsToMonitor[chatId] && walletsToMonitor[chatId].includes(address)) {
    walletsToMonitor[chatId] = walletsToMonitor[chatId].filter(wallet => wallet !== address);
    ctx.reply(`Removed wallet from monitoring: ${address}`);
  } else {
    ctx.reply('Address not found in monitored wallets list.');
  }
};

exports.resetAddresses = function (ctx, _, walletsToMonitor) {
  if (!walletsToMonitor) {
    walletsToMonitor = {};
  }
  let chatId = ctx.chat.id;
  walletsToMonitor[chatId] = [];
  ctx.reply('All wallets have been removed from monitoring.');
};

exports.listAddresses = function (ctx, _, walletsToMonitor) {
  let chatId = ctx.chat.id;
  if (walletsToMonitor.hasOwnProperty(chatId)) {
    const userWallets = walletsToMonitor[chatId] || [];
    if (userWallets.length > 0) {
      const walletList = userWallets.join('\n');
      ctx.reply(`Monitored wallets:\n${walletList}`);
    } else {
      ctx.reply('No wallets are currently being monitored.');
    }
  } else {
    ctx.reply('No wallets are currently being monitored.');
  }
};

