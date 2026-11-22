export type MarketState = "OPEN" | "PRE" | "POST" | "CLOSED";

export type SplitEvent = {
  date: string;
  numerator: number;
  denominator: number;
};

export type HistoryPoint = {
  date: string;
  close: number;
};

export type SpcxQuote = {
  ok: true;
  symbol: "SPCX";
  name: string;
  price: number;
  currency: "USD";
  asOf: string;
  marketState: MarketState;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  history: HistoryPoint[];
  strike: number;
  contractStrike: number;
  referenceClose: number;
  referenceDate: string;
  splits: SplitEvent[];
  source: string;
};

export type SpcxSnapshot = SpcxQuote | { ok: false; error: string };
