require("dotenv").config();
const bitcoin = require("bitcoinjs-lib");
const { log } = require("console");
const { Accounts, BtcTx, Env } = require("./src");

const mnemonic = process.env.MNEMONIC;

(async () => {
    // Initialize a master account from mnemonic
    Accounts.fromMnemonic(mnemonic);
    // Accounts.fromMnemonic(Accounts.newMnemonic(16));

    // Derive 5 children from master account using BIP44 derivation path "m/44'/1'/0'/0/"
    Accounts.deriveChildren(5, 44, 1);
    // log(Accounts);

    log("P2PKH:", Accounts.Children[0].P2PKH.address);
    log("P2SH:", Accounts.Children[0].P2SH.address);
    log("P2WPKH:", Accounts.Children[0].P2WPKH.address);

    const response1 = await consolidateUTXOs(Accounts.Children[0]);
    log({ response1 });

    const response2 = await send(
        Accounts.Children[0],
        [Accounts.Children[0].P2PKH.address, Accounts.Children[0].P2SH.address],
        [1000, 1000]
    );
    log({ response2 });
})();

async function consolidateUTXOs(account) {
    return await send(account, [], []);
}

async function send(from, to, amount) {
    // get all UTXOs of the sending P2WPKH address
    const utxos = await BtcTx.getUTXOs(from.P2WPKH.address);
    log({ utxos });

    // Create a temporary PSBT (Partial Signed Bitcoin Transaction)
    // with all the UTXOs as input. The PSBT is created and signed without fee data
    // in order to calculate the vsize
    const {
        totalValue,
        totalSpending,
        psbt: signedTempPsbt,
    } = BtcTx.createTx(from, utxos, to, amount);
    const signedPSBTHex = signedTempPsbt.toHex();
    const signedPSBTB64 = signedTempPsbt.toBase64();

    log({ totalValue });
    log({ totalSpending });
    log({ signedPSBTHex });
    log({ signedPSBTB64 });

    // acquire the estimated network fee rate (in satoshi) from RPC URL,
    // and get the rate value for "1" block confirmation
    const txFeeRate = (await BtcTx.getFeeRate())["1"];
    log({ txFeeRate });

    // extract the signed transaction from the temporary PSBT to get its `virtual size`
    // and calculate the network fee. Decimals part of the fee is removed.
    const vSize = signedTempPsbt.extractTransaction().virtualSize();
    log({ vSize });

    const txFee = (txFeeRate * vSize).toFixed(0);
    log({ txFee });

    // Create an actual PSBT with the same inputs and outputs,
    // this time the fee value is passed, so the finalized transaction
    // can be submitted and executed on the blockchain
    const { psbt: actualPsbt } = BtcTx.createTx(from, utxos, to, amount, txFee);

    // log(actualPsbt.data.globalMap.unsignedTx);

    // get the extracted finalized transaction in Hex form
    const rawTx = actualPsbt.extractTransaction().toHex();

    log("Raw transaction:", rawTx);

    log("Sending raw transaction...");

    // If the transaction has been successfully submitted to the blockchain,
    // `response.data` would contain the transaction hash, and an error message otherwise.
    // const response = await BtcTx.sendTransaction(rawTx);
    // return response.data;
}
