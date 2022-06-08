# DLC Manager Smart Contract

This smart contract is the interface for creating and closing DLCs via the DLC.Link infrastructure. This version of the contract does not support price feeds, and only closes the DLC when the owner of the DLC chooses to close it. For cases where the DLC requires market prices of assets (e.g. BTC price) please see this repo instead: [DLC Manager with Price Feeds](https://github.com/DLC-link/dlc-redstone-smart-contract)

Learn more about [DLCs](https://github.com/DLC-link/dlc-clarity-smart-contract#What-Are-DLCs) and [DLC.Link](https://github.com/DLC-link/dlc-clarity-smart-contract#About-DLC-Link) below.

# Overview
A DLC requires an oracle to attest to a specific outcome among the predefined set of outcomes. That means trust.

This contract acts to feed the outcome of the DLC. By using a smart contract for this task, the implementation of the logic, as well as the data being used, is stamped on the chain, and is visible and reviewable by everyone. 

# How to interact with this contract 

## Opening a DLC
When you register a DLC with this contract using the `open-new-dlc` function, a DLC is opened on our DLC server with the associated outcomes (CETs). The DLC *announcement hash*, which needed to fund the DLC, is available on the website, and eventually via an API call and on-chain.

*(TBD How does the UUID or handle come back to the caller?)*

The creation of a DLC can also be triggered with a traditional JSON API call (*coming soon TBD*)

With the announcement hash, you are now able to set up the DLC between the two participants (users, user/protocol, etc.)

## Closing the DLC
The DLC will be closed when the `principal` who opened the contract chooses to close it. When the contract function is called, the DLC.Link backend system catches this event and closes the DLC in the DLC oracle with the associated outcome data. An *attestation hash* is now created and like the announcement hash, can be acquired via the website or API (or eventually smart contract).

The attestation hash is what will be used by the participants (user, protocol, etc.) to unlock the funds in the DLC.

# Contributing
We are happy to have support and contribution from the community. Please find us on Discord and see below for developer details.

## Setup
For reference, a sample of this deployed contract can be found here: [DLC-Manager](https://explorer.stacks.co/txid/0x4bc611b40fc13e31062d4c1ff7978a71c59da4cbec958a015ef5c2976b97d03d?chain=testnet)

Add `secrets.js` file with the following lines, filling in your private data. 

If you fill in your mnemonic phrase only, you can use the `pk-extractor.js` script to print your private and public key values.

```js
export const publicKey = '';
export const privateKey = '';
export const mnemonic = '';
```
`publicKey`: your wallet public key

`privateKey`: your private key corresponds to the public key

`mnemonic`: your menomic seed phrase, as a single space-delimited string

## Tests
Run
```console
clarinet test
```
For test coverage run
```console
clarinet test --coverage
```
And install lcov
```console
brew install lcov
genhtml coverage.lcov
open index.html
```
### Current coverage report summary
![coverage-report](https://user-images.githubusercontent.com/38463744/166215716-77a1add8-0173-454e-bad3-cd4820081f9f.png)
 
## Usage

Under scripts folder there are predefined scripts to:
* create dlc (emits an event)
* open new dlc
* close dlc
* early close dlc
* get dlc
* get all open dlc

These can be used as an example for later reference.

## Get all open DLCs UUID
Clarity does things a little differently than other dapp programming languages. By design, lists have fixed lengths, and there are no loops (for programmer safety and decidability).  Therefore, we have chosen to keep track of data needed by the contract through the use of maps and minting an NFT for each DLC contract opened.

This contract mints an NFT with each DLC opened, and burns it when it is closed. Because of this, we can easily poll the specific NFT balance of the contract to get the open UUIDs. This is very convenient since NFTs are first class citizens in Clarity and easy to work with them. See `get-all-open-dlc.js` to see this in detail.

[Api docs for the call](https://docs.hiro.so/api?_gl=1*itpyo4*_ga*NzQwMjIzMDMxLjE2NDk4MzYyODk.*_ga_NB2VBT0KY2*MTY1MTIxNDk1NC41LjAuMTY1MTIxNDk1NC4w#operation/get_nft_holdings)

Here is an example response where the UUID is the `repr` key in a hex format.
```json
{
    "limit": 50,
    "offset": 0,
    "total": 2,
    "results": [
        {
            "asset_identifier": "ST31H4TTX6TVMEE86TYV6PN6XPQ6J7NCS2DD0XFW0.discreet-log-storage::open-dlc",
            "value": {
                "hex": "0x02000000057575696431",
                "repr": "0x7575696431"
            },
            "tx_id": "0x3985fbed42431257013699e189e261c1253d4067e66a9d9323b3463130839baa"
        },
        {
            "asset_identifier": "ST31H4TTX6TVMEE86TYV6PN6XPQ6J7NCS2DD0XFW0.discreet-log-storage::open-dlc",
            "value": {
                "hex": "0x02000000057575696432",
                "repr": "0x7575696432"
            },
            "tx_id": "0xacf460c36ac1f5c90b14382265382b8e2e49b59dc2b17b84900cbdae4376932e"
        }
    ]
}
```

## Error codes

```
unauthorised                 u2001
dlc-already-added            u2002
unknown-dlc                  u2003
not-reached-closing-time     u2004
already-closed               u2005
already-passed-closing-time  u2006
not-closed                   u2007
```

## Example calls
Refresh the page if it says not found.
* [Create DLC](https://explorer.stacks.co/txid/0xb83fe527c74ec1d40e8a5e06f9b08daeb26bd99fdc76d797ebe86cd4812c37e7?chain=testnet)
* [Open new DLC](https://explorer.stacks.co/txid/0x3985fbed42431257013699e189e261c1253d4067e66a9d9323b3463130839baa?chain=testnet)
* [Close DLC](https://explorer.stacks.co/txid/0xf3bd922b555330db8c97e572365148234c3267f3d7a5059a24d244127580a4a4?chain=testnet)
* [Early Close DLC](https://explorer.stacks.co/txid/0x3fb84c4a118ba4613af0199ea3f6ef5c5109c94f0fe790595b4ee3e61070f34c?chain=testnet)

# Scripts
The scripts directory includes an example of how to call each of the functions via JS. These can be used to learn about the functionality of the contract, as well as for calling to the contract. 

# What Are DLCs
[Discreet Log Contracts](https://dci.mit.edu/smart-contracts) (DLCs) facilitate conditional payments on Bitcoin between two or more parties. By creating a Discreet Log Contract, two parties can form a monetary contract redistributing their funds to each other without revealing any details to the blockchain. Its appearance on the Bitcoin blockchain will be no different than an ordinary multi-signature output, so no external observer can learn its existence or details from the public ledger. A DLC is similar to a 2-of-3 multisig transaction where the third participant is an “oracle”.  An oracle is a 3rd party source of data or information that the parties to the DLC trust as the source of truth for the contract. The oracle is incentivized to be a fair arbiter of the contract.

# About DLC Link
DLC.Link is building infrastructure to empower decentralized applications and smart contract developers to easily leverage the power of DLCs. We provide companies and applications with a traditional REST API and a smart contract interface to create and manage DLCs for their use cases.

DLCs require an oracle to attest to a specific outcome among the predefined set of outcomes. That means trust.

Why power DLC oracles with smart contracts? By using a smart contract for this task, the implementation of the logic, as well as the data being used, is stamped on the chain, and is *visible and reviewable* by everyone. 

Unlike other DLC Oracle server solutions, DLC.link allows the DLCs to be configured with a simple interface, API or via smart contract, and to act on a wide-set of events and data sources through our decentralized infrastructure. 

There are two types of events / data sources supported by DLC.link.

1. Off-chain pricing data, such as the current price of BTC, ETH, etc. In fact, any numeric data from Redstone Oracle Network is supported. This case is covered by another contract, found here: [DLC Manager with Price Feeds](https://github.com/DLC-link/dlc-redstone-smart-contract)

2. On-chain events, such as a completed transaction, a function call, etc. (Also, because Stacks can read the state of the BTC blockchain, actions can be taken directly on Stacks in response to funding transactions of DLCs on BTC. *This is continuing to be researched, and may be dependent on this project: https://grants.stacks.org/dashboard/grants/235)
