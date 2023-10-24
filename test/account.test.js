const bitcoin = require("bitcoinjs-lib");
const ecc = require("tiny-secp256k1");
const { ECPairFactory } = require("ecpair");
const { Accounts, KeyNode } = require("../src/account");

const ECPair = ECPairFactory(ecc);

describe("Accounts", () => {
    beforeAll(() => {
        Accounts.IsInitialized = false;
        Accounts.MasterKey = {};
        Accounts.Children = [];
    });

    describe("fromMnemonic", () => {
        test("should throw an error if mnemonic is invalid", () => {
            const invalidMnemonic = "invalid mnemonic";

            expect(() => {
                Accounts.fromMnemonic(invalidMnemonic);
            }).toThrow("Invalid mnemonic");
        });

        test("DeriveChildren should throw an error if Accounts is not initialized", () => {
            expect(() => {
                Accounts.deriveChildren();
            }).toThrow("Accounts must be initialize first");
        });

        test("should initialize Accounts with valid mnemonic", () => {
            const mnemonic = Accounts.newMnemonic(16);

            Accounts.fromMnemonic(mnemonic);

            expect(Accounts.IsInitialized).toBe(true);
            expect(Accounts.MasterKey).toBeInstanceOf(KeyNode);
        });

        test("should not allow reinitialization", () => {
            const mnemonic = Accounts.newMnemonic(16);

            expect(() => {
                Accounts.fromMnemonic(mnemonic);
            }).toThrow("Accounts already initialized");
        });
    });

    describe("deriveChildren", () => {
        beforeEach(() => {
            Accounts.IsInitialized = false;
            Accounts.Children = [];
        });

        it("should derive child keys", () => {
            // Accounts.fromMnemonic(mnemonic);

            expect(() => {
                Accounts.deriveChildren(5, 44, 0, 0, 0);
            }).not.toThrow();

            expect(Accounts.Children).toHaveLength(5);
        });

        test("should derive specified number of children", () => {
            Accounts.IsInitialized = true;
            const numberOfChildren = 3;

            Accounts.deriveChildren(numberOfChildren);

            expect(Accounts.Children).toHaveLength(numberOfChildren);
            expect(Accounts.Children[0]).toBeInstanceOf(KeyNode);
        });

        test("should derive children with correct parameters", () => {
            Accounts.IsInitialized = true;
            const numberOfChildren = 1;
            const purpose = 44;
            const cointype = 0;
            const account = 0;
            const receiving = 0;

            Accounts.deriveChildren(
                numberOfChildren,
                purpose,
                cointype,
                account,
                receiving
            );

            const derivedNode = Accounts.Children[0];

            expect(derivedNode.P2PKH).toEqual(expect.any(Object));
            expect(derivedNode.P2WPKH).toEqual(expect.any(Object));
            // Add more assertions for other properties if needed
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
            expect(
                bitcoin.address.toBech32(p2wpkhAddress, 0, "bc1")
            ).toBeTruthy();
        });
    });

    describe("when Accounts is initialized", () => {
        beforeEach(() => {
            Accounts.IsInitialized = true;
            Accounts.Children = [];
        });

        test("should derive distinct sets of children from different derivation path", () => {
            const numberOfChildren = 5;

            // Derivation path: m/44'/0'/0'/0
            Accounts.deriveChildren(numberOfChildren, 44);
            const firstSet = [...Accounts.Children];

            Accounts.Children = [];
            // Derivation path: m/49'/0'/0'/0
            Accounts.deriveChildren(numberOfChildren, 49);
            const secondSet = [...Accounts.Children];

            expect(firstSet).toHaveLength(numberOfChildren);
            expect(secondSet).toHaveLength(numberOfChildren);
            expect(firstSet).not.toEqual(secondSet);
        });

        test("should throw an error for invalid derivation parameters", () => {
            const invalidNumberOfChildren = -1;

            expect(() => {
                Accounts.deriveChildren(invalidNumberOfChildren);
            }).toThrow("Invalid number of children");

            // Add more tests for other invalid parameters if needed
        });

        test("should handle large number of children", () => {
            const numberOfChildren = 1000;

            Accounts.deriveChildren(numberOfChildren);

            expect(Accounts.Children).toHaveLength(numberOfChildren);
            expect(Accounts.Children[0]).toBeInstanceOf(KeyNode);
        });

        // test("should handle maximum values for derivation parameters", () => {
        //     const numberOfChildren = Number.MAX_SAFE_INTEGER;
        //     const purpose = 2**31 - 1;
        //     const cointype = 2**31 - 1;
        //     const account = 2**31 - 1;
        //     const receiving = 2**31 - 1;

        //     expect(() => {
        //         Accounts.deriveChildren(
        //             numberOfChildren,
        //             purpose,
        //             cointype,
        //             account,
        //             receiving
        //         );
        //     }).not.toThrow();

        //     // Add assertions if needed
        // });
    });

    afterAll(() => {
        // Reset the Accounts object after all tests
        Accounts.IsInitialized = false;
        Accounts.MasterKey = {};
        Accounts.Children = [];
    });
});
