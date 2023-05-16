const { Telegraf, Markup } = require('telegraf');
const { ethers } = require('ethers');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_KEY);

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

bot.start((ctx) => {
    ctx.reply('Welcome to Multichain Event Listener', getKeyboard());
});


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

const listeners = new Map();
// bot.hears(isValidAddress())

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

    if (!isValidAddress(address)) {
        ctx.reply(`Invalid address. Please send a valid smart contract address or wallet.`);
    } else if (Object.keys(wallets).includes(network)) {
        if (wallets[network].includes(address)) {
            ctx.reply(`The address ${address} is already added to the ${network} wallet.`);
        } else {
            wallets[network].push(address);
            ctx.reply(`Added address ${address} to ${network} wallet.`);
        }
    } else {
        ctx.reply(`Invalid network. Please choose from BSC, ETH, BSCT, GFD.`);
    }
});

bot.hears('/reset', (ctx) => {
    for (const network in wallets) {
        wallets[network] = [];
    }
    ctx.reply('All addresses have been cleared from the wallets.');
});

async function listener(provider, network, ctx) {
    if (listeners.has(network)) {
        return; // If a listener already exists for this network, do not set a new one
    }

    let latestBlock = await provider.getBlockNumber();

    const blockListener = async (blockNumber) => {
        if (blockNumber >= latestBlock && networkState[network]) {
            const message = `New block detected on ${network}: ${blockNumber}`;
            ctx.reply(message);
            try {
                // const block = await provider.getBlock(blockNumber);
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
    let replyMessage = 'Wallets:\n';
    const networks = Object.keys(wallets);

    for (const network of networks) {
        replyMessage += `${network}: ${wallets[network].join(', ')}\n`;
    }

    ctx.reply(replyMessage);
});



bot.on('sticker', (ctx) => ctx.reply('👍'));
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
