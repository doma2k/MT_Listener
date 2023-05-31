const cosmosjs = require("cosmosjs");

const network = cosmosjs.network("https://gnfd-testnet-fullnode-tendermint-us.nodereal.io"); // Update with the appropriate LCD URL

network.setBech32MainPrefix("cosmos");
network.setRpcURL("https://gnfd-testnet-fullnode-tendermint-us.nodereal.io"); // Update with the appropriate RPC URL
const blockHeight = 1000; // Specify the block height you want to start from

async function fetchTransactions(blockHeight) {
    try {
        const block = await network.getBlocks(blockHeight);
        const transactions = block.block.data.txs;

        console.log("Block Height:", blockHeight);
        console.log("Transactions:", transactions);

        if (block.block.header.height > 1) {
            fetchTransactions(blockHeight - 1);
        }
    } catch (error) {
        console.error("Error fetching block transactions:", error);
    }
}

fetchTransactions(blockHeight);
