import { SPCX } from "./contract";
import { getSalesFundamentals } from "./fundamentals";
import type { HistoryPoint, MarketState, SpcxSnapshot, SplitEvent } from "./types";
import { fetchChart } from "./yahoo";

function round2(n: number) {
  return Number(n.toFixed(2));
}

function sessionDate(unixSeconds: number, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(unixSeconds * 1000));
}

function readMarketState(meta: { currentTradingPeriod?: Record<string, { start: number; end: number }> }, nowSec: number): MarketState {
  const period = meta?.currentTradingPeriod;
  const inside = (window?: { start: number; end: number }) =>
    !!window && nowSec >= window.start && nowSec < window.end;
  if (inside(period?.regular)) return "OPEN";
  if (inside(period?.pre)) return "PRE";
  if (inside(period?.post)) return "POST";
  return "CLOSED";
}

function readSplits(result: { events?: { splits?: Record<string, { date: number; numerator: number; denominator: number }> } }, timeZone: string): SplitEvent[] {
  const raw = result?.events?.splits || {};
  return Object.values(raw)
    .map((split) => ({
      date: sessionDate(split.date, timeZone),
      numerator: Number(split.numerator),
      denominator: Number(split.denominator),
    }))
    .filter((split) => split.numerator > 0 && split.denominator > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function factorAfter(splits: SplitEvent[], date: string) {
  return splits.reduce((factor, split) => {
    if (split.date <= date) return factor;
    return factor * (split.numerator / split.denominator);
  }, 1);
}

export async function getSpcxSnapshot(): Promise<SpcxSnapshot> {
  try {
    const period1 = String(Math.floor(Date.UTC(2026, 10, 16) / 1000));
    const period2 = String(Math.floor(Date.now() / 1000) + 86_400);
    const [quote, historyResult, sales] = await Promise.all([
      fetchChart("SPCX", { interval: "1d", range: "1d", includePrePost: "true" }),
      fetchChart("SPCX", { period1, period2, interval: "1d", events: "div|split" }),
      getSalesFundamentals(),
    ]);

    const meta = quote?.meta ?? {};
    const priceRaw = Number(meta.regularMarketPrice);
    if (!Number.isFinite(priceRaw) || priceRaw <= 0) {
      return { ok: false, error: "Yahoo returned no SPCX price." };
    }

    const timeZone = meta.exchangeTimezoneName || historyResult?.meta?.exchangeTimezoneName || "America/New_York";
    const asOfSec = Number(meta.regularMarketTime);
    const asOf = Number.isFinite(asOfSec) ? new Date(asOfSec * 1000).toISOString() : new Date().toISOString();
    const today = Number.isFinite(asOfSec) ? sessionDate(asOfSec, timeZone) : sessionDate(Date.now() / 1000, timeZone);
    const splits = readSplits(historyResult, timeZone);

    const timestamps: number[] = historyResult?.timestamp || [];
    const closes: Array<number | null> = historyResult?.indicators?.quote?.[0]?.close || [];
    const byDate = new Map<string, number>();
    timestamps.forEach((stamp, index) => {
      const close = closes[index];
      if (close == null || !Number.isFinite(close) || close <= 0) return;
      const date = sessionDate(stamp, timeZone);
      if (date < SPCX.referenceDate) return;
      byDate.set(date, round2(close / factorAfter(splits, date)));
    });

    const price = round2(priceRaw / factorAfter(splits, today));
    byDate.set(today, price);
    const history: HistoryPoint[] = [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, close]) => ({ date, close }));

    const todayIndex = history.findIndex((point) => point.date === today);
    const previousClose = todayIndex > 0 ? history[todayIndex - 1].close : null;
    const change = previousClose == null ? null : round2(price - previousClose);
    const changePercent = previousClose ? ((price - previousClose) / previousClose) * 100 : null;
    const shareFactor = factorAfter(splits, SPCX.referenceDate);
    const strike = round2(SPCX.strike / shareFactor);
    const referencePrice = round2(SPCX.referenceClose / shareFactor);

    return {
      ok: true,
      symbol: "SPCX",
      name: meta.longName || meta.shortName || SPCX.name,
      price,
      currency: "USD",
      asOf,
      marketState: readMarketState(meta, Math.floor(Date.now() / 1000)),
      previousClose,
      change,
      changePercent,
      history,
      strike,
      contractStrike: SPCX.strike,
      referenceClose: SPCX.referenceClose,
      referenceDate: SPCX.referenceDate,
      splits: splits.filter((split) => split.date > SPCX.referenceDate),
      referencePrice,
      sales,
      source: "Yahoo Finance chart API",
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Quote failed." };
  }
}
