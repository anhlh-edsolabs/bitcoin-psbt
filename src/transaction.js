const axios = require("axios");
const bitcoin = require("bitcoinjs-lib");
const ecc = require("tiny-secp256k1");
const { ECPairFactory } = require("ecpair");
const { log } = require("console");
const { Env } = require("./env");
const { Accounts, KeyNode } = require("./account");

const ECPair = ECPairFactory(ecc);
const validator = (pubkey, msghash, signature) =>
    ECPair.fromPublicKey(pubkey).verify(msghash, signature);

function createTx(
    from,
    utxos = [],
    to = [],
    amount = [],
    fee = 0,
    requireSigning = true
) {
    const outputScript = from.P2WPKH.output;
    const psbt = new bitcoin.Psbt({ network: Env.Network });

    let inputs = [],
        outputs = [],
        totalValue = 0,
        totalSpending = 0;
    if (utxos.length > 0) {
        for (const utxo of utxos) {
            const input = {
                hash: utxo.txid,
                index: utxo.vout,
                witnessUtxo: {
                    script: outputScript,
                    value: utxo.value,
                },
            };

            totalValue += utxo.value;

            inputs.push(input);
        }
        psbt.addInputs(inputs);

        if (to.length == amount.length) {
            for (let i = 0; i < to.length; i++) {
                const output = {
                    address: to[i],
                    value: amount[i],
                };

                totalSpending += amount[i];

                outputs.push(output);
            }

            psbt.addOutputs(outputs);
        }

        // add change output
        psbt.addOutput({
            address: from.P2WPKH.address.toString(),
            value: totalValue - totalSpending - fee,
        });

        // Signing is required for extracting the finalized transaction 
        // from PSBT and acquiring its virtual size
        if (requireSigning) {
            const keypair = ECPair.fromWIF(from.WIF, Env.Network);
            psbt.signAllInputs(keypair);
            psbt.validateSignaturesOfAllInputs(validator);
            psbt.finalizeAllInputs();
        }
    }

    return { totalValue, totalSpending, psbt };
}

async function getUTXOs(address) {
    const ApiEndpoint = "address";
    const ApiUtxo = "utxo";

    const query = `${Env.ApiRoot.Testnet}/${ApiEndpoint}/${address}/${ApiUtxo}`;

    const response = await axios.get(query);

    return response.data;
}

async function getFeeRate() {
    const ApiEndpoint = "fee-estimates";

    const query = `${Env.ApiRoot.Mainnet}/${ApiEndpoint}`;

    const response = await axios.get(query);

    return response.data;
}

async function sendTransaction(rawTx) {
    const ApiEndpoint = "tx";

    const query = `${Env.ApiRoot.Testnet}/${ApiEndpoint}`;
    const response = await axios.post(query, rawTx);

    return response;
}

module.exports = { BtcTx: { createTx, getUTXOs, getFeeRate, sendTransaction } };
