import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

//NOTE: the get-block-info-time alway returns u0 so the closing-time is set according to that in the tests

const BTChex = "BTC";
const UUID = "fakeuuid";
const nftAssetContract = "open-dlc";
const contractName = "discreet-log-storage";

function hex2ascii(hexx: string) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 2; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

Clarinet.test({
    name: "create-dlc emits an event",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "create-dlc", [types.buff(BTChex), types.uint(10), types.uint(10)], deployer.address)
        ]);

        block.receipts[0].result.expectOk().expectBool(true);
        const event = block.receipts[0].events[0];

        assertEquals(typeof event, 'object');
        assertEquals(event.type, 'contract_event');
        assertEquals(event.contract_event.topic, "print");
        assertStringIncludes(event.contract_event.value, "asset: 0x425443")
    },
});


Clarinet.test({
    name: "open-new-dlc creates a new dlc and mints an open-dlc nft",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(10), types.uint(10), types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall(contractName, "get-dlc", [types.buff(UUID)], deployer.address)
        ]);

        block.receipts[0].result.expectOk().expectBool(true);
        const event = block.receipts[0].events[0];

        assertEquals(typeof event, 'object');
        assertEquals(event.type, 'nft_mint_event');
        assertEquals(event.nft_mint_event.asset_identifier.split("::")[1], nftAssetContract);
        assertEquals(event.nft_mint_event.recipient.split(".")[1], contractName);

        const dlc = block.receipts[1].result.expectSome().expectTuple();

        assertEquals(hex2ascii(dlc.asset), "BTC");
        assertEquals(hex2ascii(dlc.uuid), "fakeuuid");
        assertEquals(dlc.status, "none");
        assertEquals(dlc.creator, wallet_1.address);
    },
});

Clarinet.test({
    name: "can't add the same DLC twice",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(10), types.uint(10), types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(10), types.uint(10), types.principal(wallet_1.address)], deployer.address)
        ]);

        const err = block.receipts[1].result.expectErr();
        assertEquals(err, "u2002"); // err-dlc-already-added
    },
});

Clarinet.test({
    name: "only contract owner can add DLC",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(10), types.uint(10), types.principal(wallet_1.address)], wallet_1.address),
        ]);

        const err = block.receipts[0].result.expectErr();
        assertEquals(err, "u2001"); // err-unauthorised
    },
});

Clarinet.test({
    name: "close-dlc updates status and actual-closing-time and burns the corresponding nft",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(0), types.uint(0), types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall(contractName, "close-dlc", [types.buff(UUID)], wallet_1.address),
            Tx.contractCall(contractName, "get-dlc", [types.buff(UUID)], deployer.address)
        ]);

        block.receipts[0].result.expectOk().expectBool(true);
        const mintEvent = block.receipts[0].events[0];

        assertEquals(typeof mintEvent, 'object');
        assertEquals(mintEvent.type, 'nft_mint_event');
        assertEquals(mintEvent.nft_mint_event.asset_identifier.split("::")[1], nftAssetContract);
        assertEquals(mintEvent.nft_mint_event.recipient.split(".")[1], contractName);

        const dlc = block.receipts[2].result.expectSome().expectTuple();
        assertEquals(dlc.status, "(some u1)")

        block.receipts[1].result.expectOk().expectBool(true);
        const burnEvent = block.receipts[1].events[0];

        assertEquals(typeof burnEvent, 'object');
        assertEquals(burnEvent.type, 'nft_burn_event');
        assertEquals(burnEvent.nft_burn_event.asset_identifier.split("::")[1], nftAssetContract);
        assertEquals(burnEvent.nft_burn_event.sender.split(".")[1], contractName);
    },
});


Clarinet.test({
    name: "early-close-dlc updates status and actual-closing-time and burns the corresponding nft",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(5), types.uint(0), types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall(contractName, "early-close-dlc", [types.buff(UUID)], wallet_1.address),
            Tx.contractCall(contractName, "get-dlc", [types.buff(UUID)], deployer.address)
        ]);

        block.receipts[0].result.expectOk().expectBool(true);
        const mintEvent = block.receipts[0].events[0];

        assertEquals(typeof mintEvent, 'object');
        assertEquals(mintEvent.type, 'nft_mint_event');
        assertEquals(mintEvent.nft_mint_event.asset_identifier.split("::")[1], nftAssetContract);
        assertEquals(mintEvent.nft_mint_event.recipient.split(".")[1], contractName);

        const dlc = block.receipts[2].result.expectSome().expectTuple();
        assertEquals(dlc.status, "(some u0)") // indication of early close

        block.receipts[1].result.expectOk().expectBool(true);
        const burnEvent = block.receipts[1].events[0];

        assertEquals(typeof burnEvent, 'object');
        assertEquals(burnEvent.type, 'nft_burn_event');
        assertEquals(burnEvent.nft_burn_event.asset_identifier.split("::")[1], nftAssetContract);
        assertEquals(burnEvent.nft_burn_event.sender.split(".")[1], contractName);
    },
});

Clarinet.test({
    name: "can't close a dlc twice",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(0), types.uint(0), types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall(contractName, "close-dlc", [types.buff(UUID)], wallet_1.address),
            Tx.contractCall(contractName, "close-dlc", [types.buff(UUID)], wallet_1.address),
        ]);

        const err = block.receipts[2].result.expectErr();
        assertEquals(err, "u2005"); // err-already-closed
    },
});

Clarinet.test({
    name: "can't early close a dlc twice",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(5), types.uint(0), types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall(contractName, "early-close-dlc", [types.buff(UUID)], wallet_1.address),
            Tx.contractCall(contractName, "early-close-dlc", [types.buff(UUID)], wallet_1.address),
        ]);

        const err = block.receipts[2].result.expectErr();
        assertEquals(err, "u2005"); // err-already-closed
    },
});

Clarinet.test({
    name: "only authorized wallets can close dlc",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(0), types.uint(0), types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall(contractName, "close-dlc", [types.buff(UUID)], wallet_2.address),
        ]);

        const err = block.receipts[1].result.expectErr();
        assertEquals(err, "u2001"); // err-already-closed
    },
});

Clarinet.test({
    name: "only authorized wallets can eraly close dlc",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(5), types.uint(0), types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall(contractName, "early-close-dlc", [types.buff(UUID)], wallet_2.address),
        ]);

        const err = block.receipts[1].result.expectErr();
        assertEquals(err, "u2001"); // err-already-closed
    },
});

Clarinet.test({
    name: "dlc-status throws u2007 of not closed",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(5), types.uint(0), types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall(contractName, "dlc-status", [types.buff(UUID)], wallet_2.address),
        ]);

        const err = block.receipts[1].result.expectErr();
        assertEquals(err, "u2007"); // err-already-closed
    },
});

Clarinet.test({
    name: "dlc-status returns correct status for closed DLC",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall(contractName, "open-new-dlc", [types.buff(UUID), types.buff(BTChex), types.uint(0), types.uint(0), types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall(contractName, "close-dlc", [types.buff(UUID)], wallet_1.address),
            Tx.contractCall(contractName, "dlc-status", [types.buff(UUID)], wallet_1.address),
        ]);

        block.receipts[2].result.expectOk();
        assertEquals(block.receipts[2].result, "(ok u1)");
    },
});
