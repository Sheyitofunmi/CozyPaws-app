/*
 * A tiny fake Base Sepolia JSON-RPC node for the e2e tests, so the real
 * wallet flow (viem in the browser + on-chain verification on the server) can
 * be tested without a network, a wallet extension or test funds.
 *
 * - Mines a block every 400ms, so confirmations arrive like on a real chain.
 * - `cp_sendTransfer` (called by the fake wallet in the browser) records a
 *   USDC transfer and returns its hash, with a real ERC-20 Transfer log.
 * - Answers the reads viem makes: chain id, block number, blocks, receipts,
 *   balanceOf (every address holds 1,000 test USDC).
 */
import http from "node:http";

const PORT = Number(process.env.MOCK_CHAIN_PORT ?? 8545);
const CHAIN_ID = 84532;
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const hex = (n) => `0x${BigInt(n).toString(16)}`;
const pad32 = (h) => `0x${h.replace(/^0x/, "").toLowerCase().padStart(64, "0")}`;
const randomHash = () => `0x${[...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("")}`;

let block = 1_000n;
setInterval(() => (block += 1n), 400).unref();

const receipts = new Map();

function blockObject(number) {
  return {
    number: hex(number),
    hash: pad32(hex(number)),
    parentHash: pad32(hex(number - 1n)),
    timestamp: hex(Math.floor(Date.now() / 1000)),
    gasLimit: "0x1c9c380",
    gasUsed: "0x0",
    baseFeePerGas: "0x1",
    miner: "0x0000000000000000000000000000000000000000",
    nonce: "0x0000000000000000",
    difficulty: "0x0",
    totalDifficulty: "0x0",
    size: "0x0",
    extraData: "0x",
    logsBloom: `0x${"0".repeat(512)}`,
    transactionsRoot: pad32("0"),
    stateRoot: pad32("0"),
    receiptsRoot: pad32("0"),
    sha3Uncles: pad32("0"),
    mixHash: pad32("0"),
    transactions: [],
    uncles: [],
  };
}

function handle(method, params) {
  switch (method) {
    case "eth_chainId":
      return hex(CHAIN_ID);
    case "net_version":
      return String(CHAIN_ID);
    case "eth_blockNumber":
      return hex(block);
    case "eth_getBlockByNumber": {
      const tag = params?.[0];
      return blockObject(tag === "latest" || !tag ? block : BigInt(tag));
    }
    case "eth_call":
      // balanceOf(address) → 1,000 USDC (6 decimals)
      return pad32(hex(1_000n * 10n ** 6n));
    case "eth_getTransactionReceipt":
      return receipts.get(params?.[0]?.toLowerCase()) ?? null;
    case "cp_sendTransfer": {
      // params: [{ from, token, data }] where data is transfer(address,uint256)
      const { from, token, data } = params[0];
      const to = `0x${data.slice(10 + 24, 10 + 64)}`;
      const value = BigInt(`0x${data.slice(10 + 64, 10 + 128)}`);
      const hash = randomHash();
      const mined = block + 1n;
      const log = {
        address: token.toLowerCase(),
        topics: [TRANSFER_TOPIC, pad32(from), pad32(to)],
        data: pad32(hex(value)),
        blockNumber: hex(mined),
        blockHash: pad32(hex(mined)),
        transactionHash: hash,
        transactionIndex: "0x0",
        logIndex: "0x0",
        removed: false,
      };
      // "Mined" into the next block.
      setTimeout(() => {
        receipts.set(hash, {
          transactionHash: hash,
          transactionIndex: "0x0",
          blockHash: pad32(hex(mined)),
          blockNumber: hex(mined),
          from: from.toLowerCase(),
          to: token.toLowerCase(),
          cumulativeGasUsed: "0x5208",
          gasUsed: "0x5208",
          effectiveGasPrice: "0x1",
          contractAddress: null,
          logs: [log],
          logsBloom: `0x${"0".repeat(512)}`,
          status: "0x1",
          type: "0x2",
        });
      }, 400);
      return hash;
    }
    default:
      return null;
  }
}

http
  .createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    if (req.method === "OPTIONS") return res.end();
    if (req.method === "GET") return res.end("ok");
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw || "{}");
      const one = (r) => ({ jsonrpc: "2.0", id: r.id, result: handle(r.method, r.params) });
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(Array.isArray(body) ? body.map(one) : one(body)));
    });
  })
  .listen(PORT, () => console.log(`mock chain on :${PORT}`));
