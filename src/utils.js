const bitcoin = require("bitcoinjs-lib");
const { Env } = require("./env")

function getAddress(node, network = null) {
    return (
        bitcoin.payments.p2pkh({ pubkey: node.publicKey, network }).address ??
        null
    );
}

function getAddress2(node, network = bitcoin.networks.bitcoin) {
    return bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({
            pubkey: node.publicKey,
            network: network,
        }),
        network: network,
    }).address;
}

function getP2WPKH(node, network) {
    return bitcoin.payments.p2wpkh({
        pubkey: node.publicKey,
        network: network,
    }).address;
}

function getP2PKH(node, network) {
    return bitcoin.payments.p2pkh({ pubkey: node.publicKey, network: network })
        .address;
}

module.exports = {
    utils: {
        getAddress,
        getAddress2,
        getP2WPKH, 
        getP2PKH
    },
};
