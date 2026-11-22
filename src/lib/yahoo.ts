const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function fetchChart(symbol: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  let last = "Yahoo Finance did not return a chart.";
  for (const host of HOSTS) {
    const url = `${host}/v8/finance/chart/${encodeURIComponent(symbol)}?${qs}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        last = `Yahoo responded ${res.status}.`;
        continue;
      }
      const body = await res.json();
      const result = body?.chart?.result?.[0];
      if (result) return result;
      last = body?.chart?.error?.description || "Yahoo returned an empty chart.";
    } catch (error) {
      last = error instanceof Error ? error.message : "Yahoo request failed.";
    }
  }
  throw new Error(last);
}
