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

bot.hears(/.+/, (ctx) => {
    const inputText = ctx.message.text;
    if (!isValidAddress(inputText)) {
        ctx.reply(`Invalid address. Please send a valid smart contract address or wallet.`);
    } else {
        ctx.reply(`Added : ${inputText}`);
    }
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

bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.on('sticker', (ctx) => ctx.reply('👍'));
bot.hears('hi', (ctx) => ctx.reply('Hey there'));
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
