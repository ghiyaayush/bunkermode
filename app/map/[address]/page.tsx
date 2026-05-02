import { detectChain } from "@/lib/known-contracts";
import MapLoader from "@/components/MapLoader";

interface Props { params: Promise<{ address: string }> }

export default async function MapPage({ params }: Props) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw);
  const chain = detectChain(address);
  return <MapLoader address={address} chain={chain === "unknown" ? "ethereum" : chain} />;
}
