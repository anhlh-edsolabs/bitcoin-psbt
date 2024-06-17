const bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
// const ecc = require("@bitcoinerlab/secp256k1");
const { ECPairFactory } = require("ecpair");
const { BIP32Factory } = require("bip32");
const rng = require("randombytes");

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

module.exports = { ECPair, bitcoin, ecc, bip32, bip39, BIP32Factory, rng };
