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

export type SalesQuarter = {
  end: string;
  revenue: number;
  source: "sec" | "yahoo";
  close: number | null;
  marketCap: number | null;
};

export type SalesFundamentals =
  | {
      ok: true;
      shares: number | null;
      shareBasis: "implied" | "basic" | null;
      ttmRevenue: number | null;
      asOf: string;
      quarters: SalesQuarter[];
      secFilingUrl: string | null;
      yahooUrl: string;
    }
  | { ok: false; error: string };

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
  referencePrice: number;
  sales: SalesFundamentals;
  source: string;
};

export type SpcxSnapshot = SpcxQuote | { ok: false; error: string };
