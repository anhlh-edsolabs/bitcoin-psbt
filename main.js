require("dotenv").config();
const { log } = require("console");
const { Accounts, BtcTx } = require("./src");

const mnemonic = process.env.MNEMONIC;

(async () => {
    // Initialize a master account from mnemonic
    // Accounts.fromMnemonic(mnemonic);
    Accounts.fromMnemonic(Accounts.newMnemonic(16));

    // Derive 5 children from master account using BIP44 derivation path "m/44'/1'/0'/0/"
    Accounts.deriveChildren(5, 44, 1);
    // log(Accounts);

    // get all UTXOs of the sending P2WPKH address
    const utxos = await BtcTx.getUTXOs(Accounts.Children[0].P2WPKH.address);
    log(utxos);

    // Create a temporary PSBT (Partial Signed Bitcoin Transaction)
    // with all the UTXOs as input. The PSBT is created and signed without fee data
    // in order to calculate the vsize
    // Notice that the `to` and `amount` params are empty,
    // indicate that all the UTXOs would be combined and send to the original sender,
    // thus creating a new UTXO after the transaction has been confirmed.
    const {
        totalValue,
        totalSpending,
        psbt: signedTempPsbt,
    } = BtcTx.createTx(Accounts.Children[0], utxos, [], []);

    log({ totalValue });
    log({ totalSpending });

    // acquire the estimated network fee rate (in satoshi) from RPC URL
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
    const { psbt: actualPsbt } = BtcTx.createTx(
        Accounts.Children[0],
        utxos,
        [],
        [],
        txFee
    );

    // log(actualPsbt.data.globalMap.unsignedTx);

    // get the extracted finalized transaction in Hex form
    const rawTx = actualPsbt.extractTransaction().toHex();

    log("Raw transaction:", rawTx);

    log("Sending raw transaction...");
    const response = await BtcTx.sendTransaction(rawTx);

    // If the transaction has been successfully submitted to the blockchain,
    // `response.data` would contain the transaction hash, and an error message otherwise.
    log(response.data);
})();
