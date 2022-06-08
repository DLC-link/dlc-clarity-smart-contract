import * as secrets from './secrets.js';

import { getPublicKeyFromPrivate, publicKeyToAddress } from '@stacks/encryption';
import { StacksTestnet } from "@stacks/network";
import { TransactionVersion } from '@stacks/transactions';
import { generateWallet, restoreWalletAccounts, getStxAddress } from "@stacks/wallet-sdk";

// for mainnet, use `StacksMainnet()` //choose between test or mainnet
const network = new StacksTestnet();
const secretKey = secrets.mnemonic;
const wallet = await generateWallet({ secretKey, password: "" });
const acc = await restoreWalletAccounts({
  wallet,
  gaiaHubUrl: "https://hub.blockstack.org",
  network,
});

acc.accounts.forEach((account, index) => {
  console.log(`\nAccount ${index}`)

  const privateKey = account.stxPrivateKey;
  console.log(`private_key: ${privateKey}`);
  const pubKey = getPublicKeyFromPrivate(privateKey.slice(0, -2));
  console.log(`public_key: ${pubKey}`);
  console.log(`public_key_address: ${publicKeyToAddress(pubKey)}`);

  const stxAddress = getStxAddress({ account, transactionVersion: TransactionVersion.Testnet }); // Change this for stacks address by network
  console.log(`Stacks_address: ${stxAddress}`);
})
