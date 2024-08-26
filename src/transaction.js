// const bitcoin = require("bitcoinjs-lib");
const core = require("./bitcoin-core");
const {
    isP2PKH,
    isP2WPKH,
    isP2SHScript,
    isP2TR,
} = require("bitcoinjs-lib/src/psbt/psbtutils");
const { toXOnly } = require("bitcoinjs-lib/src/psbt/bip371");
const { Env } = require("./env");
const { Constants } = require("./constants");
const { Account } = require("./account");
const { SignatureValidator } = require("./sig-validator");

function createTx(
    from,
    utxos = [],
    to = [],
    amount = [],
    fee = 0,
) {
    const psbt = new core.bitcoin.Psbt({ network: Env.Network });

    let inputs = [],
        outputs = [],
        totalValue = 0,
        totalSpending = 0,
        nochange = false;

    if (typeof from !== "object" || !(from instanceof Account)) {
        throw new Error("Invalid account object");
    }

    if (utxos.length > 0) {
        let isP2TRAddress = false;
        const fromNode = from.Node[from.Type];
        for (const utxo of utxos) {
            const input = setupInput(utxo, fromNode);

            if (isP2TR(fromNode.output)) {
                isP2TRAddress = true;
            }

            inputs.push(input);
        }
        psbt.addInputs(inputs);

        totalValue = utxos.reduce((total, utxo) => total + utxo.value, 0);

        if (to.length == amount.length) {
            if (
                amount.length == 1 &&
                amount[0] == Constants.MAX_SUPPLY_SATOSHIS
            ) {
                nochange = true;
                totalSpending = totalValue - fee;
                const output = {
                    address: to[0],
                    value: totalSpending,
                };

                outputs.push(output);
            } else {
                for (let i = 0; i < to.length; i++) {
                    const output = {
                        address: to[i],
                        value: amount[i],
                    };

                    totalSpending += amount[i];

                    outputs.push(output);
                }
            }

            psbt.addOutputs(outputs);
        }

        // handle fee
        if (totalSpending + fee > totalValue) {
            throw new Error("Insufficient funds");
        }

        // add change output
        if (!nochange) {
            psbt.addOutput({
                address: fromNode.address.toString(),
                value: totalValue - totalSpending - fee,
            });
        }

        // console.log("Unsigned PSBT:", JSON.stringify(psbt, null, 2));

        // Signing is required for extracting the finalized transaction
        // from PSBT and acquiring its virtual size
        const keypair = core.ECPair.fromWIF(from.Node.WIF, Env.Network);

        let signer = keypair;
        let validator = SignatureValidator.validator;

        if (isP2TRAddress) {
            signer = keypair.tweak(
                core.bitcoin.crypto.taggedHash(
                    "TapTweak",
                    toXOnly(keypair.publicKey)
                )
            );
            validator = SignatureValidator.schnorrValidator;
        }

        psbt.signAllInputs(signer);
        psbt.validateSignaturesOfAllInputs(validator);
        psbt.finalizeAllInputs();
        
        let _fee = psbt.getFee();
        console.log("Fee:", _fee);
    }

    return { totalValue, totalSpending, psbt };
}

function setupInput(utxo, fromNode) {
    const input = {
        hash: utxo.txid,
        index: utxo.vout,
    };

    // build the input object based on the output script type
    if (isP2PKH(fromNode.output)) {
        input.nonWitnessUtxo = Buffer.from(utxo.txHex, "hex");
    } else {
        input.witnessUtxo = {
            script: fromNode.output,
            value: utxo.value,
        };

        if (isP2SHScript(fromNode.output)) {
            input.redeemScript = fromNode.redeem.output;
        } else if (isP2WPKH(fromNode.output) || isP2TR(fromNode.output)) {
            if (isP2TR(fromNode.output)) {
                input.tapInternalKey = toXOnly(fromNode.pubkey);
            }
        }
    }

    return input;
}

module.exports = {
    BtcTx: { createTx },
};
