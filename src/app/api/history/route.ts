import { NextResponse } from 'next/server';

async function getHistory(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1wk&range=1y`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } });
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return [];
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  return timestamps.map((t: number, i: number) => ({ date: new Date(t * 1000).toISOString().split('T')[0], close: closes[i] })).filter((d: any) => d.close);
}

export async function GET() {
  try {
    const [nvda, nhy] = await Promise.all([getHistory('NVDA'), getHistory('NHY.OL')]);
    const NVDA_STRIKE = 178.88, NHY_STRIKE = 70.54;
    const points = nvda.map((n: any, i: number) => {
      const nhyPoint = nhy[i];
      if (!nhyPoint) return null;
      const nvdaRet = ((n.close - NVDA_STRIKE) / NVDA_STRIKE) * 100;
      const nhyRet = ((nhyPoint.close - NHY_STRIKE) / NHY_STRIKE) * 100;
      return { date: n.date, nvda: +nvdaRet.toFixed(2), nhy: +nhyRet.toFixed(2), spread: +(nhyRet - nvdaRet).toFixed(2) };
    }).filter(Boolean);
    return NextResponse.json(points);
  } catch { return NextResponse.json([]); }
}
