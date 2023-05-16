const { ethers } = require('ethers');
require('dotenv').config();


async function listenerBSC(getWalletsToMonitor, sendMessage, listening, provider) {
  try {
    provider.on("block", async (blockNumber) => {
      if (listening) {
        const block = await provider.getBlockWithTransactions(blockNumber);
        const walletsToMonitor = getWalletsToMonitor(); // Get the current walletsToMonitor object
        // console.log("walletsToMonitor:", JSON.stringify(walletsToMonitor, null, 2));

        for (const transaction of block.transactions) {
          // Updated code to handle the new walletsToMonitor object format
          const chatIds = Object.keys(walletsToMonitor);

          // Loop through chatIds to send messages to every matching chat
          for (const chatId of chatIds) {
            const userWallets = walletsToMonitor[chatId];
            if (userWallets.includes(transaction.from) || userWallets.includes(transaction.to)) {
              sendMessage(
                chatId,
                `Transaction detected for monitored wallet:\n` +
                `BSC Mainnet\n` +
                `Block number: ${blockNumber}\n` +
                `From: ${transaction.from}\n` +
                `To: ${transaction.to}\n` +
                `Value: ${ethers.utils.formatEther(transaction.value)} BNB\n` +
                `Gas price: ${transaction.gasPrice.toString()} Gwei\n` +
                `Transaction hash: ${transaction.hash}`
              );
            }
          }
        }
      }
    });
  } catch (error) {
    console.log("Error: ", error.message);
  }
}

module.exports = listenerBSC;