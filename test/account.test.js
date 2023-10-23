const bitcoin = require("bitcoinjs-lib");
const { Accounts, KeyNode } = require("../src/account");

describe("Bitcoin Key Generation", () => {
    let mnemonic;

    beforeAll(() => {
        // Generate a new mnemonic before running the tests
        mnemonic = Accounts.newMnemonic(16); // Adjust the entropy size as needed
    });

    it("should initialize with a valid mnemonic", () => {
        expect(() => {
            Accounts.fromMnemonic(mnemonic);
        }).not.toThrow();
    });

    it("should derive child keys", () => {
        // Accounts.fromMnemonic(mnemonic);

        expect(() => {
            Accounts.deriveChildren(5, 44, 0, 0, 0);
        }).not.toThrow();

        expect(Accounts.Children).toHaveLength(5);
    });

    it("should generate valid P2PKH and P2WPKH addresses", () => {
        // Accounts.fromMnemonic(mnemonic);
        Accounts.deriveChildren(1, 44, 0, 0, 0);

        const childNode = Accounts.Children[0];
        const p2pkhAddress = childNode.P2PKH.address;
        const p2wpkhAddress = childNode.P2WPKH.address;

        expect(
            bitcoin.address
                .toOutputScript(p2pkhAddress, bitcoin.networks.testnet)
                .toString("hex")
        ).toBeTruthy();
        expect(bitcoin.address.toBech32(p2wpkhAddress, 0, "bc1")).toBeTruthy();
    });

    it("should not allow reinitialization", () => {
        // Accounts.fromMnemonic(mnemonic);

        expect(() => {
            Accounts.fromMnemonic(mnemonic);
        }).toThrow("Accounts already initialized");
    });
});
