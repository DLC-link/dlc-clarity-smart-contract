import * as secrets from '../secrets.js';
import { StacksMocknet, StacksTestnet } from "@stacks/network";

const isProd = secrets.environment == 'production';

export const network = isProd ? new StacksTestnet() : new StacksMocknet();

export const senderAddress = secrets.publicKey;
export const senderKey = secrets.privateKey;
export const assetName = 'open-dlc';  // this is the NFTs name

export const contractAddress = isProd ? "ST12S2DB1PKRM1BJ1G5BQS0AB0QPKHRVHWXDBJ27R" : "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
export const contractName = "dlc-manager-v1";

export const UUID = "uuid01";
export const timestamp = 1657103428;
