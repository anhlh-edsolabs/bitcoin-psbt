const bip39 = require("bip39");
const bitcoin = require("bitcoinjs-lib");
const ecc = require("tiny-secp256k1");
const crypto = require("crypto");
const { BIP32Factory } = require("bip32");
const { Env } = require("./env");

const bip32 = BIP32Factory(ecc);

class KeyNode {
    constructor(node) {
        this.P2PKH = this.getP2PKH(node);
        this.P2SH = this.getP2SH(node);
        this.P2WPKH = this.getP2WPKH(node);
        this.WIF = node.toWIF();
        this.PrivKeyRaw = node.privateKey.toString("hex");
        this.PrivKey = node.toBase58();
    }

    getP2PKH(node) {
        return bitcoin.payments.p2pkh({
            pubkey: node.publicKey,
            network: Env.Network,
        });
    }

    getP2SH(node) {
        return bitcoin.payments.p2sh({
            redeem: this.getP2WPKH(node),
            network: Env.Network,
        });
    }

    getP2WPKH(node) {
        return bitcoin.payments.p2wpkh({
            pubkey: node.publicKey,
            network: Env.Network,
        });
    }
}

const Accounts = {
    IsInitialized: false,
    MasterKey: {},
    Children: [],

    /// 16 <= size <= 32 (128 to 256 bits)
    newMnemonic: function (size) {
        const entropy = crypto.randomBytes(size);

        return bip39.entropyToMnemonic(entropy);
    },

    fromMnemonic: function (mnemonic) {
        if (this.IsInitialized) {
            throw new Error("Accounts already initialized");
        }
        if (!bip39.validateMnemonic(mnemonic)) {
            throw new Error("Invalid mnemonic");
        }
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const root = bip32.fromSeed(seed, Env.Network);

        this.MasterKey = new KeyNode(root);

        // set the flag IsInitialize to true and prevent it from being overwritten
        Object.defineProperty(this, "IsInitialized", {
            value: true,
            writable: false,
        });
    },

    deriveChildren: function (
        numberOfChildren = 1,
        purpose = 44,
        cointype = 0,
        account = 0,
        receiving = 0
    ) {
        if (!this.IsInitialized) {
            throw new Error("Accounts must be initialize first");
        }
        if(numberOfChildren < 0) {
            throw new Error("Invalid number of children")
        }
        const root = bip32.fromBase58(this.MasterKey.PrivKey, Env.Network);
        for (let i = 0; i < numberOfChildren; i++) {
            const node = root
                .deriveHardened(purpose)
                .deriveHardened(cointype)
                .deriveHardened(account)
                .derive(receiving)
                .derive(i);

            this.Children.push(new KeyNode(node));
        }
    },
};

module.exports = { Accounts, KeyNode };
