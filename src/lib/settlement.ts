import audit from "../../data/nvda-nhy-settlement.json";
import { sumMoney } from "./format";

type Dividend = { exDate: string; amount: number; currency: string };

type LegFile = {
  side: string;
  ticker: string;
  symbol?: string;
  exchange: string;
  currency: "USD" | "NOK";
  strike: { date: string; rawClose: number; close: number; volume: number };
  settlement: { date: string; rawClose: number; close: number; volume: number };
  dividends: Dividend[];
};

export type SettledLeg = LegFile & {
  dividendsTotal: number;
  priceReturn: number;
  dividendReturn: number;
  totalReturn: number;
};

function score(strike: number, settlement: number, dividends: number) {
  return {
    priceReturn: ((settlement - strike) / strike) * 100,
    dividendReturn: (dividends / strike) * 100,
    totalReturn: ((settlement + dividends - strike) / strike) * 100,
  };
}

function build(leg: LegFile): SettledLeg {
  const dividendsTotal = sumMoney(leg.dividends.map((d) => d.amount));
  return { ...leg, dividendsTotal, ...score(leg.strike.close, leg.settlement.close, dividendsTotal) };
}

const nvda = build(audit.nvda as LegFile);
const nhy = build(audit.nhy as LegFile);
const winner = nvda.totalReturn > nhy.totalReturn ? nvda : nhy.totalReturn > nvda.totalReturn ? nhy : null;
const loser = winner == null ? null : winner === nvda ? nhy : nvda;

function near(actual: number, expected: number) {
  return Math.abs(actual - expected) < 1e-6;
}

if (
  !near(nvda.totalReturn, audit.result.nvda.totalReturnPct) ||
  !near(nhy.totalReturn, audit.result.nhy.totalReturnPct) ||
  winner?.side !== audit.result.winner ||
  loser?.side !== audit.result.loser
) {
  throw new Error("NVDA/NHY settlement math does not match data/nvda-nhy-settlement.json");
}

export const settled = {
  rule: audit.settlementRule,
  source: audit.source,
  stake: audit.bet.stake,
  nvda,
  nhy,
  winner,
  loser,
  margin: nhy.totalReturn - nvda.totalReturn,
  pays: audit.result.pays,
};
