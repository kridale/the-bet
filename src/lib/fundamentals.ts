import type { SalesFundamentals } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const SEC_UA = "the-bet scoreboard (https://the-bet-ruddy.vercel.app)";
const CIK = "0001181412";
const TTL_MS = 60 * 60 * 1000;

type Quarter = { end: string; revenue: number; source: "sec" | "yahoo" };

let cache: { at: number; value: SalesFundamentals } | null = null;

function daysBetween(start: string, end: string) {
  return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000;
}

async function yahooSession() {
  const seed = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const rows = typeof seed.headers.getSetCookie === "function" ? seed.headers.getSetCookie() : [];
  const cookie = rows.map((row) => row.split(";")[0]).filter(Boolean).join("; ");
  const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": UA, Cookie: cookie, Accept: "text/plain" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!crumbRes.ok) throw new Error(`Yahoo crumb responded ${crumbRes.status}.`);
  const crumb = (await crumbRes.text()).trim();
  if (!crumb || crumb.includes("<")) throw new Error("Yahoo did not return a crumb.");
  return { cookie, crumb };
}

async function yahooJson(path: string, session: { cookie: string; crumb: string }) {
  const joiner = path.includes("?") ? "&" : "?";
  const url = `https://query1.finance.yahoo.com${path}${joiner}crumb=${encodeURIComponent(session.crumb)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json", Cookie: session.cookie },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Yahoo responded ${res.status}.`);
  return res.json();
}

async function secJson(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": SEC_UA, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`SEC responded ${res.status}.`);
  return res.json();
}

function secQuarters(facts: {
  facts?: { "us-gaap"?: Record<string, { units?: Record<string, Array<{ start?: string; end?: string; val?: number; form?: string }>> }> };
}) {
  const rows = facts.facts?.["us-gaap"]?.RevenueFromContractWithCustomerExcludingAssessedTax?.units?.USD ?? [];
  const quarters: Quarter[] = [];
  for (const row of rows) {
    if (!row.start || !row.end || row.val == null || !(row.val > 0)) continue;
    if (row.form !== "10-Q" && row.form !== "10-K") continue;
    const span = daysBetween(row.start, row.end);
    if (span < 80 || span > 100) continue;
    quarters.push({ end: row.end, revenue: row.val, source: "sec" });
  }
  return quarters;
}

function latestFilingUrl(submissions: {
  filings?: { recent?: { form?: string[]; accessionNumber?: string[]; primaryDocument?: string[] } };
}) {
  const recent = submissions.filings?.recent;
  const forms = recent?.form ?? [];
  const index = forms.findIndex((form) => form === "10-Q" || form === "10-K");
  if (index < 0) return null;
  const accession = (recent?.accessionNumber?.[index] ?? "").replace(/-/g, "");
  const doc = recent?.primaryDocument?.[index];
  if (!accession || !doc) return null;
  return `https://www.sec.gov/Archives/edgar/data/${Number(CIK)}/${accession}/${doc}`;
}

function yahooQuarters(payload: { timeseries?: { result?: Array<{ quarterlyTotalRevenue?: Array<{ asOfDate?: string; periodType?: string; reportedValue?: { raw?: number } }> }> } }) {
  const series = payload.timeseries?.result?.flatMap((item) => item.quarterlyTotalRevenue ?? []) ?? [];
  const quarters: Quarter[] = [];
  for (const row of series) {
    const revenue = row.reportedValue?.raw;
    if (row.periodType !== "3M" || !row.asOfDate || revenue == null || !(revenue > 0)) continue;
    quarters.push({ end: row.asOfDate, revenue, source: "yahoo" });
  }
  return quarters;
}

function mergeQuarters(sec: Quarter[], yahoo: Quarter[]) {
  const byEnd = new Map<string, Quarter>();
  for (const quarter of yahoo) byEnd.set(quarter.end, quarter);
  for (const quarter of sec) byEnd.set(quarter.end, quarter);
  return [...byEnd.values()].sort((a, b) => a.end.localeCompare(b.end));
}

function trailingFour(quarters: Quarter[]) {
  if (quarters.length < 4) return null;
  const last = quarters.slice(-4);
  for (let i = 1; i < last.length; i++) {
    const gap = daysBetween(last[i - 1].end, last[i].end);
    if (gap < 80 || gap > 100) return null;
  }
  return last;
}

async function loadSalesFundamentals(): Promise<SalesFundamentals> {
  const session = await yahooSession();
  const [summary, series, facts, submissions] = await Promise.all([
    yahooJson("/v10/finance/quoteSummary/SPCX?modules=defaultKeyStatistics", session),
    yahooJson(
      "/ws/fundamentals-timeseries/v1/finance/timeseries/SPCX?symbol=SPCX&type=quarterlyTotalRevenue&period1=1577836800&period2=1900000000",
      session
    ),
    secJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${CIK}.json`).catch(() => null),
    secJson(`https://data.sec.gov/submissions/CIK${CIK}.json`).catch(() => null),
  ]);

  const stats = summary?.quoteSummary?.result?.[0]?.defaultKeyStatistics ?? {};
  const implied = Number(stats.impliedSharesOutstanding?.raw);
  const basic = Number(stats.sharesOutstanding?.raw);
  const shares = implied > 0 ? implied : basic;
  const shareBasis = implied > 0 ? "implied" : "basic";
  if (!(shares > 0)) {
    return { ok: false, error: "Yahoo did not return shares outstanding." };
  }

  const sec = facts ? secQuarters(facts) : [];
  const yahoo = yahooQuarters(series);
  const window = trailingFour(mergeQuarters(sec, yahoo));
  if (!window) {
    return { ok: false, error: "Fewer than four consecutive quarterly revenues were returned." };
  }

  const ttmRevenue = window.reduce((sum, quarter) => sum + quarter.revenue, 0);
  if (!(ttmRevenue > 0)) return { ok: false, error: "Trailing revenue was not a positive number." };

  const secMatchedQuarters = window
    .filter((quarter) => {
      const filed = sec.find((item) => item.end === quarter.end);
      return filed != null && Math.abs(filed.revenue - quarter.revenue) < 1000;
    })
    .map((quarter) => quarter.end);

  return {
    ok: true,
    shares,
    shareBasis,
    ttmRevenue,
    asOf: window[window.length - 1].end,
    quarters: window,
    secFilingUrl: submissions ? latestFilingUrl(submissions) : null,
    yahooUrl: "https://finance.yahoo.com/quote/SPCX/key-statistics/",
    secMatchedQuarters,
  };
}

export async function getSalesFundamentals(): Promise<SalesFundamentals> {
  if (cache && Date.now() - cache.at < TTL_MS && cache.value.ok) return cache.value;
  try {
    const value = await loadSalesFundamentals();
    if (value.ok) cache = { at: Date.now(), value };
    else if (cache?.value.ok) return cache.value;
    return value;
  } catch (error) {
    if (cache?.value.ok) return cache.value;
    return { ok: false, error: error instanceof Error ? error.message : "Fundamentals failed." };
  }
}
