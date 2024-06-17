const axios = require("axios");
const { Env } = require("./env");
const { Constants } = require("./constants")

const ApiPath = {
    Address: "address",
    Transaction: "tx",
    Estimate: "fee-estimates",
};

const Endpoint = {
    Utxo: "utxo",
    Hex: "hex",
};

const UTXOFilterType = {
    All: 0,
    OnlyNonOrdinal: 1,
};

async function getUTXOs(address, confirmed = true) {
    const query = `${Env.ApiRoot}/${ApiPath.Address}/${address}/${Endpoint.Utxo}`;

    const response = await axios.get(query);

    // check if the returned data is a json object
    if (typeof response.data !== "object") {
        throw new Error("Invalid response data");
    }

    utxos = response.data;

    return confirmed ? utxos.filter((utxo) => utxo.status.confirmed) : utxos;
}

async function getNonOrdinalsUTXOs(address, confirmed = true) {
    const utxos = await getUTXOs(address, confirmed);

    // filter out UTXOs with value less than dust limit -> possibly contains ordinal inscriptions
    return utxos.filter((utxo) => utxo.value > Constants.DUST);
}

async function getTxHex(txId) {
    const query = `${Env.ApiRoot}/${ApiPath.Transaction}/${txId}/${Endpoint.Hex}`;
    const response = await axios.get(query);

    return response.data;
}

async function getUTXOsWithTxHex(
    address,
    utxoType = UTXOFilterType.All | UTXOFilterType.OnlyNonOrdinal
) {
    const utxos =
        utxoType == UTXOFilterType.All
            ? await getUTXOs(address)
            : await getNonOrdinalsUTXOs(address);
    const unspents = [];
    if (utxos.length > 0) {
        for (const utxo of utxos) {
            const txHex = await getTxHex(utxo.txid);

            // assign the hex value to utxo.txHex field
            utxo.txHex = txHex;
            unspents.push(utxo);
        }
    }

    return unspents;
}

async function getTotalUTXOValue(
    addressOrUtxos,
    utxoType = UTXOFilterType.All | UTXOFilterType.OnlyNonOrdinal
) {
    try {
        if (typeof addressOrUtxos === "string") {
            // If the first argument is a string, treat it as an address
            const address = addressOrUtxos;
            const utxos =
                utxoType == UTXOFilterType.All
                    ? await getUTXOs(address)
                    : await getNonOrdinalsUTXOs(address);
            return getTotalUTXOValue(utxos);
        } else if (Array.isArray(addressOrUtxos)) {
            // If the first argument is an array, treat it as a list of UTXOs
            if (addressOrUtxos.length === 0) return 0;

            const utxos = addressOrUtxos;
            return utxos.reduce((total, utxo) => total + utxo.value, 0);
        } else {
            throw new Error(
                "Invalid argument. Expected a string address or an array of UTXOs."
            );
        }
    } catch (error) {
        console.error(`Failed to get total UTXO value: ${error}`);
        throw error;
    }
}

async function getFeeRate() {
    const query = `${Env.ApiRoot}/${ApiPath.Estimate}`;

    const response = await axios.get(query);
    // check if the returned data is a json object
    if (typeof response.data !== "object") {
        throw new Error("Invalid response data");
    }

    return response.data;
}

async function sendTransaction(rawTx) {
    const ApiEndpoint = "tx";

    const query = `${Env.ApiRoot}/${ApiEndpoint}`;
    const response = await axios.post(query, rawTx);

    return response;
}

module.exports = {
    Api: {
        UTXOFilterType,
        getUTXOs,
        getNonOrdinalsUTXOs,
        getUTXOsWithTxHex,
        getTotalUTXOValue,
        getTxHex,
        getFeeRate,
        sendTransaction,
    },
};
