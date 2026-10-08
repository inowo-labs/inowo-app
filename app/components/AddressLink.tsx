import { accountUrl, shortAddress } from "../lib/format";

export default function AddressLink({ address }: { address: string }) {
  return (
    <a
      href={accountUrl(address)}
      target="_blank"
      rel="noopener noreferrer"
      title={address}
      aria-label={`View account ${address} on Stellar Expert (opens in new tab)`}
      className="font-mono text-violet-400 hover:text-violet-300"
    >
      {shortAddress(address)}
    </a>
  );
}
