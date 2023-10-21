require("dotenv").config();
const bitcoin = require("bitcoinjs-lib");

const NETWORK = process.env.NETWORK;
const RPC_API_TESTNET = process.env.RPC_API_TESTNET;
const RPC_API_MAINNET = process.env.RPC_API_MAINNET;

let Network;
switch (NETWORK) {
    case "testnet":
        Network = bitcoin.networks.testnet
        break;
    case "regtest":
        Network = bitcoin.networks.regtest
    case "mainnet":
        Network = bitcoin.networks.bitcoin
        break;
}

const ApiRoot = {
    Testnet: RPC_API_TESTNET,
    Mainnet: RPC_API_MAINNET,
};

module.exports = { Env: { Network, ApiRoot } };
