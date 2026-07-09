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

export async function GET() {
  try {
    const [nvda, nhy] = await Promise.all([getQuote('NVDA'), getQuote('NHY.OL')]);
    const NVDA_STRIKE = 178.88, NHY_STRIKE = 70.54;
    const nvdaReturn = nvda ? ((nvda.price - NVDA_STRIKE) / NVDA_STRIKE) * 100 : 0;
    const nhyReturn = nhy ? ((nhy.price - NHY_STRIKE) / NHY_STRIKE) * 100 : 0;
    const nvdaDay = nvda ? ((nvda.price - nvda.prevClose) / nvda.prevClose) * 100 : 0;
    const nhyDay = nhy ? ((nhy.price - nhy.prevClose) / nhy.prevClose) * 100 : 0;
    return NextResponse.json({
      nvda: { price: nvda?.price || 0, return: nvdaReturn, dayChange: nvdaDay, strike: NVDA_STRIKE },
      nhy: { price: nhy?.price || 0, return: nhyReturn, dayChange: nhyDay, strike: NHY_STRIKE },
      spread: nhyReturn - nvdaReturn,
      leader: nhyReturn > nvdaReturn ? 'G-WAGON' : 'THE CLAW',
      updated: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
