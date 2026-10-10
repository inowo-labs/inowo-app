import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Networks,
  StrKey,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID ??
  "CCWFDV2MIDV7QOEUJNZDFRRJY75O7S65JPVJ2S2WNARJ4INEMDTCNOPV";
export const RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? Networks.TESTNET;

/** Signs a transaction envelope (base64 XDR) and returns the signed XDR. */
export type Signer = (txXdr: string) => Promise<string>;

export interface InvokeResult {
  hash: string;
  value: unknown;
}

const server = () => new rpc.Server(RPC_URL);
const contract = () => new Contract(CONTRACT_ID);

const u32 = (n: number) => nativeToScVal(n, { type: "u32" });
const i128 = (n: bigint) => nativeToScVal(n, { type: "i128" });
const address = (a: string) => new Address(a).toScVal();

/** Simulates, signs, submits, and waits for a contract call to complete. */
export async function invoke(
  source: string,
  method: string,
  args: xdr.ScVal[],
  sign: Signer
): Promise<InvokeResult> {
  const rpcServer = server();
  const account = await rpcServer.getAccount(source);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract().call(method, ...args))
    .setTimeout(60)
    .build();

  // Simulation fills in the footprint, auth, and resource fees, and fails
  // early (before any signature) if the contract would reject the call.
  const prepared = await rpcServer.prepareTransaction(tx);
  const signed = TransactionBuilder.fromXDR(
    await sign(prepared.toXDR()),
    NETWORK_PASSPHRASE
  );

  const sent = await rpcServer.sendTransaction(signed);
  if (sent.status === "ERROR") {
    throw new Error("The network rejected the transaction. Please try again.");
  }

  const result = await rpcServer.pollTransaction(sent.hash, { attempts: 30 });
  if (result.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction ${result.status.toLowerCase()}`);
  }
  return {
    hash: sent.hash,
    value: result.returnValue ? scValToNative(result.returnValue) : undefined,
  };
}

/** Runs a read-only contract call through simulation. No signature needed. */
async function read(method: string, args: xdr.ScVal[]): Promise<unknown> {
  // Simulation does not check the source account, so a placeholder works.
  const source = new Account(
    "GCSOXELWBWKPQHSOUTEPGBUHR6W72V3ZCBO7DNBXRSEXZ3UN54CGVESY",
    "0"
  );
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract().call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server().simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error((sim as rpc.Api.SimulateTransactionErrorResponse).error);
  }
  return sim.result ? scValToNative(sim.result.retval) : undefined;
}

export const inowo = {
  sponsorEvent: (sponsor: string, eventId: number, amount: bigint, sign: Signer) =>
    invoke(sponsor, "sponsor_event", [address(sponsor), u32(eventId), i128(amount)], sign),

  buyTicket: (buyer: string, eventId: number, tierIndex: number, sign: Signer) =>
    invoke(buyer, "buy_ticket", [address(buyer), u32(eventId), u32(tierIndex)], sign),

  refundSponsorship: (sponsor: string, eventId: number, sign: Signer) =>
    invoke(sponsor, "refund_sponsorship", [address(sponsor), u32(eventId)], sign),

  sponsorTotal: async (eventId: number, sponsor: string): Promise<bigint> =>
    BigInt((await read("get_sponsor_total", [u32(eventId), address(sponsor)])) as bigint),

  endEvent: (organizer: string, eventId: number, sign: Signer) =>
    invoke(organizer, "end_event", [address(organizer), u32(eventId)], sign),

  cancelEvent: (organizer: string, eventId: number, sign: Signer) =>
    invoke(organizer, "cancel_event", [address(organizer), u32(eventId)], sign),

  releaseFunds: (
    organizer: string,
    eventId: number,
    recipient: string,
    amount: bigint,
    memo: string,
    sign: Signer
  ) =>
    invoke(
      organizer,
      "release_funds",
      [
        address(organizer),
        u32(eventId),
        address(recipient),
        i128(amount),
        nativeToScVal(memo, { type: "string" }),
      ],
      sign
    ),
};

/** Mirrors MAX_MEMO_LEN in the contract; the limit is in bytes, not characters. */
export const MAX_MEMO_BYTES = 200;

export function memoBytes(memo: string): number {
  return new TextEncoder().encode(memo).length;
}

export function isStellarAddress(value: string): boolean {
  return StrKey.isValidEd25519PublicKey(value.trim());
}

const CONTRACT_ERRORS: Record<number, string> = {
  3: "This event no longer exists.",
  5: "Only the event's organizer can do this.",
  6: "This event is no longer open.",
  11: "That ticket tier doesn't exist.",
  12: "That ticket tier is sold out.",
  14: "Enter an amount greater than zero.",
  15: "Refunds open only when an event is cancelled.",
  18: "You have no sponsorship to refund for this event.",
  19: "Funds can only be released after the event has ended.",
  20: "That's more than the event holds in escrow.",
  21: "The memo must be between 1 and 200 bytes.",
};

/** Turns RPC, contract, token, and wallet errors into a sentence a user can act on. */
export function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  const code = /Error\(Contract, #(\d+)\)/.exec(message);
  if (code && !/trustline|balance/i.test(message)) {
    return CONTRACT_ERRORS[Number(code[1])] ?? `The contract rejected this (error ${code[1]}).`;
  }
  if (/trustline entry is missing/i.test(message)) {
    return "Your account can't hold USDC yet. Add Circle's testnet USDC to your wallet, then get some from faucet.circle.com.";
  }
  if (/balance is not sufficient|not within the allowed range|insufficient/i.test(message)) {
    return "Not enough USDC in your wallet. Get testnet USDC from faucet.circle.com.";
  }
  if (/account not found|Account not found/i.test(message)) {
    return "Your account isn't funded on testnet yet. Fund it with Friendbot from the Freighter wallet.";
  }
  if (/declined|rejected by the user|User declined/i.test(message)) {
    return "You declined the request in Freighter.";
  }
  return message.length > 200 ? `${message.slice(0, 200)}…` : message;
}

const STROOPS_PER_USDC = BigInt(10_000_000);

/** Parses a user-entered USDC amount ("2.5") into stroops, or null if invalid. */
export function parseUsdc(input: string): bigint | null {
  const match = /^(\d+)(?:\.(\d{1,7}))?$/.exec(input.trim());
  if (!match) return null;
  const whole = BigInt(match[1]) * STROOPS_PER_USDC;
  const fraction = BigInt((match[2] ?? "").padEnd(7, "0") || "0");
  return whole + fraction;
}

export function txUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}
