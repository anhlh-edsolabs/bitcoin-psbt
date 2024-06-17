// const bitcoin = require("bitcoinjs-lib");
const core = require("./bitcoin-core");
const {
    isP2PKH,
    isP2WPKH,
    isP2SHScript,
    isP2TR,
} = require("bitcoinjs-lib/src/psbt/psbtutils");
const { Env } = require("./env");
const { Account } = require("./account");
const { Api } = require("./apis");

// const ECPair = ECPairFactory(ecc);
const validator = (pubkey, msghash, signature) =>
    core.ECPair.fromPublicKey(pubkey).verify(msghash, signature);

function createTx(
    from,
    utxos = [],
    to = [],
    amount = [],
    fee = 0,
    requireSigning = true
) {
    // const outputScript = from.output;
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
        for (const utxo of utxos) {
            const input = {
                hash: utxo.txid,
                index: utxo.vout,
            };
            if (isP2PKH(from.Node[from.Type].output)) {
                input.nonWitnessUtxo = Buffer.from(utxo.txHex, "hex");
            } else if (isP2SHScript(from.Node[from.Type].output)) {
                input.witnessUtxo = {
                    script: from.Node[from.Type].output,
                    value: utxo.value,
                };
                input.redeemScript = from.Node[from.Type].redeem.output;
            } else if (
                isP2WPKH(from.Node[from.Type].output) ||
                isP2TR(from.Node[from.Type].output)
            ) {
                input.witnessUtxo = {
                    script: from.Node[from.Type].output,
                    value: utxo.value,
                };
            }

            totalValue += utxo.value;

            inputs.push(input);
        }
        psbt.addInputs(inputs);

        if (to.length > 0 && to.length == amount.length) {
            if (amount.length == 1 && amount[0] == 21e14) {
                nochange = true;
                const spendingAmount =
                    utxos.reduce((total, utxo) => total + utxo.value, 0) - fee;
                const output = {
                    address: to[0],
                    value: spendingAmount,
                };

                totalSpending += spendingAmount;

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
                address: from.Node[from.Type].address.toString(),
                value: totalValue - totalSpending - fee,
            });
        }

        // console.log("Unsigned PSBT:", JSON.stringify(psbt, null, 2));

        // Signing is required for extracting the finalized transaction
        // from PSBT and acquiring its virtual size
        if (requireSigning) {
            const keypair = core.ECPair.fromWIF(from.Node.WIF, Env.Network);
            psbt.signAllInputs(keypair);
            psbt.validateSignaturesOfAllInputs(validator);
            psbt.finalizeAllInputs();
        }
    }

    return { totalValue, totalSpending, psbt };
}

module.exports = {
    BtcTx: { createTx },
};
