const { ECPair, ecc } = require("./bitcoin-core");

const validator = (pubkey, msghash, signature) => {
    ECPair.fromPublicKey(pubkey).verify(msghash, signature);
};

const schnorrValidator = (pubkey, msghash, signature) => {
    // ECPair.fromPublicKey(pubkey).verifySchnorr(msghash, signature);
    ecc.verifySchnorr(msghash, pubkey, signature);
};

module.exports = { SignatureValidator: { validator, schnorrValidator } };
