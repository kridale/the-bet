import { NextResponse } from 'next/server';

async function getQuote(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 60 } });
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return null;
  const meta = result.meta;
  return { price: meta.regularMarketPrice, prevClose: meta.chartPreviousClose, currency: meta.currency };
}

async function getDividendsSince(symbol: string, sinceDate: string) {
  const since = Math.floor(new Date(sinceDate).getTime() / 1000);
  const now = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${since}&period2=${now}&interval=1d&events=div`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } });
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return { total: 0, events: [] };
  const divs = result.events?.dividends || {};
  const events = Object.values(divs).map((d: any) => ({
    date: new Date(d.date * 1000).toISOString().split('T')[0],
    amount: d.amount
  }));
  const total = events.reduce((sum: number, d: any) => sum + d.amount, 0);
  return { total, events };
}

export async function GET() {
  try {
    const NVDA_STRIKE = 178.88, NHY_STRIKE = 70.54;
    const STRIKE_DATE = '2025-11-21';

    const [nvda, nhy, nvdaDivs, nhyDivs] = await Promise.all([
      getQuote('NVDA'),
      getQuote('NHY.OL'),
      getDividendsSince('NVDA', STRIKE_DATE),
      getDividendsSince('NHY.OL', STRIKE_DATE)
    ]);

    // Total return = (price + dividends - strike) / strike * 100
    const nvdaTotalReturn = nvda ? ((nvda.price + nvdaDivs.total - NVDA_STRIKE) / NVDA_STRIKE) * 100 : 0;
    const nhyTotalReturn = nhy ? ((nhy.price + nhyDivs.total - NHY_STRIKE) / NHY_STRIKE) * 100 : 0;
    const nvdaPriceReturn = nvda ? ((nvda.price - NVDA_STRIKE) / NVDA_STRIKE) * 100 : 0;
    const nhyPriceReturn = nhy ? ((nhy.price - NHY_STRIKE) / NHY_STRIKE) * 100 : 0;
    const nvdaDay = nvda ? ((nvda.price - nvda.prevClose) / nvda.prevClose) * 100 : 0;
    const nhyDay = nhy ? ((nhy.price - nhy.prevClose) / nhy.prevClose) * 100 : 0;

    return NextResponse.json({
      nvda: {
        price: nvda?.price || 0,
        totalReturn: nvdaTotalReturn,
        priceReturn: nvdaPriceReturn,
        dayChange: nvdaDay,
        strike: NVDA_STRIKE,
        dividends: { total: nvdaDivs.total, count: nvdaDivs.events.length, events: nvdaDivs.events }
      },
      nhy: {
        price: nhy?.price || 0,
        totalReturn: nhyTotalReturn,
        priceReturn: nhyPriceReturn,
        dayChange: nhyDay,
        strike: NHY_STRIKE,
        dividends: { total: nhyDivs.total, count: nhyDivs.events.length, events: nhyDivs.events }
      },
      spread: nhyTotalReturn - nvdaTotalReturn,
      leader: nhyTotalReturn > nvdaTotalReturn ? 'G-WAGON' : 'THE CLAW',
      updated: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
