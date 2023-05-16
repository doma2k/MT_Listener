const { Telegraf, Markup } = require('telegraf');
const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_KEY);
const listeners = new Map();
const walletsDir = './wallets';

if (!fs.existsSync(walletsDir)) {
    fs.mkdirSync(walletsDir);
}
const providers = {
    "BSC": new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_ENDPOINT),
    "BSCT": new ethers.providers.JsonRpcProvider(process.env.BSCT_RPC_ENDPOINT),
    "ETH": new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_ENDPOINT),
    "GFD": new ethers.providers.JsonRpcProvider(process.env.GFD_RPC_ENDPOINT),
};
const wallets = {
    "BSC": [],
    "ETH": [],
    "BSCT": [],
    "GFD": []
};
let networkState = {
    "BSC": false,
    "ETH": false,
    "BSCT": false,
    "GFD": false
};

bot.start(async (ctx) => {
    for (let network of Object.keys(providers)) {
        if (!networkState[network]) {
            networkState[network] = true;
            await listener(providers[network], network, ctx);
        }
    }
    ctx.reply('Welcome to Multichain Event Listener. Starting all listeners.', getKeyboard());
});

bot.stop(async (ctx) => {
    for (let network of Object.keys(providers)) {
        if (!networkState[network]) {
            networkState[network] = true;
            await listener(providers[network], network, ctx);
        }
    }
    ctx.reply('Welcome to Multichain Event Listener. Starting all listeners.', getKeyboard());
});

bot.hears(/(BSC|ETH|BSCT|GFD): (Listening|Stopped)/, (ctx) => {
    const [network, status] = ctx.message.text.split(': ');
    if (status === 'Stopped') {
        networkState[network] = true;
        listener(providers[network], network, ctx);
        ctx.reply(`Listening ${network} Network Events.`, getKeyboard());
    } else if (status === 'Listening') {
        networkState[network] = false;
        stopListener(network);
        ctx.reply(`${network} listener stopped`, getKeyboard());
    }
});

bot.hears(/add (BSC|ETH|BSCT|GFD) .+/, (ctx) => {
    const inputParts = ctx.message.text.split(' ');
    const network = inputParts[1];
    const address = inputParts[2];

    const userID = String(ctx.from.id);
    let userWallets;
    try {
        const data = fs.readFileSync(`${walletsDir}/${userID}.json`);
        userWallets = JSON.parse(data);
    } catch (error) {
        console.log("No wallets file found for this user. Creating new one.");
        userWallets = {
            "BSC": [],
            "ETH": [],
            "BSCT": [],
            "GFD": []
        };
    }

    if (!isValidAddress(address)) {
        ctx.reply(`Invalid address. Please send a valid smart contract address or wallet.`);
    } else if (Object.keys(userWallets).includes(network)) {
        if (userWallets[network].includes(address)) {
            ctx.reply(`The address ${address} is already added to the ${network} wallet.`);
        } else {
            userWallets[network].push(address);
            fs.writeFileSync(`${walletsDir}/${userID}.json`, JSON.stringify(userWallets));
            ctx.reply(`Added address ${address} to ${network} wallet.`);
        }
    } else {
        ctx.reply(`Invalid network. Please choose from BSC, ETH, BSCT, GFD.`);
    }
});


bot.help((ctx) => ctx.reply(`Welcome to Multichain Event Listener!

This Telegram bot allows you to toggle event listening for different blockchain networks and add smart contract addresses or wallets to these networks. 

Inline Commands:
add [network] [address] - Add a smart contract address or wallet to the specified network.

Networks:
BSC: [Listening/Stopped] - Toggle event listening for Binance Smart Chain network.
ETH: [Listening/Stopped] - Toggle event listening for Ethereum network.
BSCT: [Listening/Stopped] - Toggle event listening for Binance Smart Chain Testnet.
GFD: [Listening/Stopped] - Toggle event listening for Greenfield network.

Other Commands:
/help - Show this help message.
/list - Show list of listening addresses`));

bot.hears('/list', (ctx) => {
    const userID = String(ctx.from.id);
    let userWallets;
    try {
        const data = fs.readFileSync(`${walletsDir}/${userID}.json`);
        userWallets = JSON.parse(data);
    } catch (error) {
        console.log("No wallets file found for this user. Creating new one.");
        userWallets = {
            "BSC": [],
            "ETH": [],
            "BSCT": [],
            "GFD": []
        };
    }

    let replyMessage = 'Wallets:\n';
    const networks = Object.keys(userWallets);

    for (const network of networks) {
        replyMessage += `${network}: ${userWallets[network].join(', ')}\n`;
    }

    ctx.reply(replyMessage);
});

bot.hears('/reset', (ctx) => {
    const userID = String(ctx.from.id);
    const emptyWallets = {
        "BSC": [],
        "ETH": [],
        "BSCT": [],
        "GFD": []
    };
    fs.writeFileSync(`${walletsDir}/${userID}.json`, JSON.stringify(emptyWallets));
    ctx.reply('All addresses have been cleared from the User.');
});

bot.on('sticker', (ctx) => ctx.reply('👍'));
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Different functions
async function listener(provider, network, ctx) {
    if (listeners.has(network)) {
        return; // If a listener already exists for this network, do not set a new one
    }

    let latestBlock = await provider.getBlockNumber();

    const blockListener = async (blockNumber) => {
        if (blockNumber >= latestBlock && networkState[network]) {
            const userID = String(ctx.from.id);
            let userWallets;
            try {
                const data = fs.readFileSync(`${walletsDir}/${userID}.json`);
                userWallets = JSON.parse(data);
            } catch (error) {
                console.log("No wallets file found for this user. Creating new one.");
                userWallets = {
                    "BSC": [],
                    "ETH": [],
                    "BSCT": [],
                    "GFD": []
                };
            }

            try {
                const block = await provider.getBlockWithTransactions(blockNumber);
                for (let transaction of block.transactions) {
                    if (userWallets[network].includes(transaction.from) || userWallets[network].includes(transaction.to)) {
                        const etherValue = ethers.utils.formatEther(transaction.value);
                        const gasPriceInEther = ethers.utils.formatEther(transaction.gasPrice);
                        const message = `
Transaction detected for address ${transaction.from === userWallets[network] ? transaction.from : transaction.to} in block ${blockNumber} on ${network}.
Block Hash: ${transaction.blockHash}
Block Number: ${transaction.blockNumber}
From: ${transaction.from}
To: ${transaction.to}
Value: ${etherValue} Ether
Gas Price: ${gasPriceInEther} Ether
Gas Limit: ${transaction.gasLimit.toString()}
Transaction Hash: ${transaction.hash}
Nonce: ${transaction.nonce}
Transaction Index: ${transaction.transactionIndex}`;
                        ctx.reply(message);
                    }
                }
            } catch (error) {
                console.error("Error fetching block details:", error);
            }
        }
    };

    provider.on("block", blockListener);
    listeners.set(network, blockListener);
}


function stopListener(network) {
    if (listeners.has(network)) {
        const blockListener = listeners.get(network);
        providers[network].removeListener("block", blockListener);
        listeners.delete(network);
    }
}

function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function getKeyboard() {
    const networks = Object.keys(networkState);
    const keyboardLayout = [];

    for (let i = 0; i < networks.length; i += 3) {
        keyboardLayout.push(
            networks.slice(i, i + 3).map(network =>
                Markup.button.text(`${network}: ${networkState[network] ? 'Listening' : 'Stopped'}`)
            )
        );
    }

    return Markup.keyboard(keyboardLayout).resize();
}