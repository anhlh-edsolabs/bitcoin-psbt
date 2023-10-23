# bitcoin-psbt

## DISCLAIMER

This repository provides examples of creating Bitcoin HDWallet, PSBT (Partial Signed Bitcoin Transaction).
The coding is purely for educational and research purpose, and should not be used for production.

## Example output of `./main.js`

```Javascript
{
  utxos: [
    {
      txid: '92e2294a4f8c37ca2bb9d2d80d0f6ca2553ae0876bb13e56f2152b345cd50eaa',
      vout: 0,
      status: [Object],
      value: 2604763
    }
  ]
}
{ totalValue: 2604763 }
{ totalSpending: 0 }
{
  signedPSBT: '70736274ff0100520200000001aa0ed55c342b15f2563eb16b87e03a55a26c0f0dd8d2b92bca378c4f4a29e2920000000000ffffffff01dbbe2700000000001600146e5fe1a00a605d4170677a24801cff64e0feb0f4000000000001011fdbbe2700000000001600146e5fe1a00a605d4170677a24801cff64e0feb0f401086b0247304402206ba6176eb3dfed675296d440d55dcfddc1df115849e88c29a0c18e0e59e702730220463c63242681cfb53686c9b1100de9c8378adcb54cc81fef9514519a03238acc01210343c9e7dd0d662da9e22394addf883b048c9b606e70cd436ba17d67542e8802b60000'
}
{ txFeeRate: 12.296 }
{ vSize: 110 }
{ txFee: '1353' }
```
