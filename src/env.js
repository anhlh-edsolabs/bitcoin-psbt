require("dotenv").config();
const bitcoin = require("bitcoinjs-lib");

const NETWORK = process.env.NETWORK;
const RPC_API_TESTNET = process.env.RPC_API_TESTNET;
const RPC_API_MAINNET = process.env.RPC_API_MAINNET;

const Network =
    NETWORK == "testnet" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

const ApiRoot = NETWORK == "testnet" ? RPC_API_TESTNET : RPC_API_MAINNET;

module.exports = { Env: { Network, ApiRoot } };
