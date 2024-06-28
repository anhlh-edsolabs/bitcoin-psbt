const core = require("./bitcoin-core");
const { toXOnly } = require("bitcoinjs-lib/src/psbt/bip371");
const { Env } = require("./env");

const AccountTypes = {
    P2PKH: "P2PKH",
    P2SH: "P2SH",
    P2WPKH: "P2WPKH",
    P2TR: "P2TR",
};

class Account {
    Node = KeyNode;
    Type = AccountTypes;

    constructor(node, type) {
        this.Node = node;
        this.Type = type;
    }
}

class KeyNode {
    Index = 0;

    constructor(node, hdPath = "m/44'/0'/0'/0") {
        this.HDPath = hdPath;
        this.P2PKH = this.getP2PKH(node);
        this.P2SH = this.getP2SH(node);
        this.P2WPKH = this.getP2WPKH(node);
        this.P2TR = this.getP2TR(node);
        this.WIF = node.toWIF();
        this.PrivKeyRaw = node.privateKey.toString("hex");
        this.PrivKey = node.toBase58();
        this.PubKeyRaw = node.publicKey.toString("hex");
        this.PubKey = node.publicKey;
    }

    getP2PKH(node) {
        return core.bitcoin.payments.p2pkh({
            pubkey: node.publicKey,
            network: Env.Network,
        });
    }

    getP2SH(node) {
        return core.bitcoin.payments.p2sh({
            redeem: this.getP2WPKH(node),
            network: Env.Network,
        });
    }

    getP2WPKH(node) {
        return core.bitcoin.payments.p2wpkh({
            pubkey: node.publicKey,
            network: Env.Network,
        });
    }

    getP2TR(node) {
        return core.bitcoin.payments.p2tr({
            internalPubkey: toXOnly(node.publicKey),
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
        const entropy = rng(size);

        return core.bip39.entropyToMnemonic(entropy);
    },

    fromMnemonic: function (mnemonic) {
        if (this.IsInitialized) {
            throw new Error("Accounts already initialized");
        }
        if (!core.bip39.validateMnemonic(mnemonic)) {
            throw new Error("Invalid mnemonic");
        }
        const seed = core.bip39.mnemonicToSeedSync(mnemonic);
        const root = core.bip32.fromSeed(seed, Env.Network);

        this.MasterKey = new KeyNode(root, "");

        // set the flag IsInitialize to true and prevent it from being overwritten
        Object.defineProperty(this, "IsInitialized", {
            value: true,
            writable: false,
        });
    },

    // deprecated
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
        if (numberOfChildren < 0) {
            throw new Error("Invalid number of children");
        }
        const root = core.bip32.fromBase58(this.MasterKey.PrivKey, Env.Network);
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

    deriveChildrenFromPath: function (path, numberOfChildren = 1) {
        if (!this.IsInitialized) {
            throw new Error("Accounts must be initialize first");
        }
        if (numberOfChildren < 0) {
            throw new Error("Invalid number of children");
        }
        const root = core.bip32.fromBase58(this.MasterKey.PrivKey, Env.Network);

        // filter children derived from the same path
        const children = this.Children.filter((child) => child.HDPath === path);
        const nextIndex = children.length;

        for (let i = nextIndex; i < numberOfChildren + nextIndex; i++) {
            const childNode = new KeyNode(
                root.derivePath(path).derive(i),
                path
            );
            childNode.Index = i;

            this.Children.push(childNode);
        }
    },
};

module.exports = { Accounts, KeyNode, Account, AccountTypes };
