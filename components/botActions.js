module.exports = function (bot, ethers, listenerBSC, listenerBSCT, listenerETH, listenerGFD, getWalletsToMonitor, sendMessage) {
    const providers = {
        "BSC": new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_ENDPOINT),
        "BSCT": new ethers.providers.JsonRpcProvider(process.env.BSCT_RPC_ENDPOINT),
        "ETH": new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_ENDPOINT),
        "GFD": new ethers.providers.JsonRpcProvider(process.env.GFD_RPC_ENDPOINT),
        // Add other networks here...
    };

    let listeners = {};
    let listening = {
        "BSC": true,
        "BSCT": true,
        "ETH": true,
        "GFD": true,
        // Add other networks here...
    };

    async function startListeners() {
        listeners["BSC"] = await listenerBSC(getWalletsToMonitor, (chatId, msg) => sendMessage(chatId, msg), true, providers["BSC"]);
        listeners["BSCT"] = await listenerBSCT(getWalletsToMonitor, (chatId, msg) => sendMessage(chatId, msg), true, providers["BSCT"]);
        listeners["ETH"] = await listenerETH(getWalletsToMonitor, (chatId, msg) => sendMessage(chatId, msg), true, providers["ETH"]);
        listeners["GFD"] = await listenerGFD(getWalletsToMonitor, (chatId, msg) => sendMessage(chatId, msg), true, providers["GFD"]);
        // Start other listeners here...
    }

    startListeners();

    // Note: In this design, switching networks doesn't change the listener behavior.
    // It only sends a message to the user.
    bot.action("CHANGE_RPC_BSC", async (ctx) => {
        ctx.answerCbQuery(`RPC address: ${process.env.BSC_RPC_ENDPOINT}`);

    });

    bot.action("CHANGE_RPC_BSCT", async (ctx) => {
        ctx.answerCbQuery(`RPC address: ${process.env.BSCT_RPC_ENDPOINT}`);
    });

    bot.action("CHANGE_RPC_ETH", async (ctx) => {
        ctx.answerCbQuery(`RPC address: ${process.env.ETH_RPC_ENDPOINT}`);
    });

    bot.action("CHANGE_RPC_GFD", async (ctx) => {
        ctx.answerCbQuery(`RPC address: ${process.env.GFD_RPC_ENDPOINT}`);
    });
}
