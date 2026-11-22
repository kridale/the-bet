import Board from "@/components/Board";
import { getSpcxSnapshot } from "@/lib/spcx";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initial = await getSpcxSnapshot();
  return <Board initial={initial} />;
}
