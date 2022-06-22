import {network, senderAddress, senderKey, contractAddress, contractName, assetName, UUID} from './common.js'

import {
  makeContractCall,
  NonFungibleConditionCode,
  broadcastTransaction,
  bufferCVFromString,
  createAssetInfo,
  makeContractNonFungiblePostCondition,
  trueCV
} from "@stacks/transactions";

const functionName = "early-close-dlc";

const postConditionCode = NonFungibleConditionCode.DoesNotOwn;
const tokenAssetName = bufferCVFromString(UUID);
const nonFungibleAssetInfo = createAssetInfo(contractAddress, contractName, assetName);

const contractNonFungiblePostCondition = makeContractNonFungiblePostCondition(
  contractAddress,
  contractName,
  postConditionCode,
  nonFungibleAssetInfo,
  tokenAssetName
);

// Replace this with the options required for your contract.
const txOptions = {
  contractAddress: contractAddress,
  contractName: contractName,
  functionName: functionName,
  functionArgs: [
    bufferCVFromString(UUID),
    trueCV()
  ],
  postConditions: [contractNonFungiblePostCondition],
  senderKey: senderKey,
  validateWithAbi: true,
  network,
  fee: 100000,  // 0.1 STX
  anchorMode: 1,
};

const transaction = await makeContractCall(txOptions);
console.log(transaction);
const broadcastResponse = await broadcastTransaction(transaction, network);
console.log("2: ", broadcastResponse);

// You can check the call status on https://explorer.stacks.co/?chain=testnet
console.log("txid:", broadcastResponse.txid);