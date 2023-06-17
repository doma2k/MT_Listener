const WebSocket = require('ws');
const { decodeTxRaw } = require("@cosmjs/proto-signing");

const ws = new WebSocket('ws://gnfd-testnet-fullnode-tendermint-us.bnbchain.org/websocket');

ws.on('open', () => {
    const subscriptionRequest = JSON.stringify({
        jsonrpc: '2.0',
        method: 'subscribe',
        params: ['tm.event = \'NewBlock\''],
        id: 1,
    });

    ws.send(subscriptionRequest);
});

ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.result && parsedMessage.result.data && parsedMessage.result.data.value) {

        const blockHeight = parsedMessage.result.data.value.block.header.height;
        const txs = parsedMessage.result.data.value.block.data.txs;

        console.log('Block Height:', blockHeight);
        if (txs) {
            txs.forEach((tx, i) => {
                let raw = Buffer.from(tx, 'base64');
                let decodedTx = decodeTxRaw(raw);
                console.log('Transaction', i + 1);
                console.log(decodedTx.body.messages);
            });
        } else {
            console.log('No transactions in this block.');
        }
    }
});

ws.on('close', function () {
    console.log('WebSocket connection closed.');
});

ws.on('error', function (error) {
    console.error('WebSocket error:', error);
});






