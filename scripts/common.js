import * as secrets from '../secrets.js';
import { StacksMocknet, StacksTestnet } from "@stacks/network";

// const env = 'production';
const env = 'development';
const isProd = env == 'production';

export const network = isProd ? new StacksTestnet() : new StacksMocknet();

export const senderAddress = secrets.publicKey;
export const senderKey = secrets.privateKey;
export const assetName = 'open-dlc';

export const contractAddress = isProd ? "sometestnetaddress" : "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
export const contractName = "discreet-log-storage";

export const UUID = "uuid4";
