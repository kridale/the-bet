import { NextResponse } from 'next/server';

async function getHistory(symbol: string) {
  const since = Math.floor(new Date('2025-11-21').getTime() / 1000);
  const now = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${since}&period2=${now}&interval=1wk&events=div`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } });
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return { prices: [], dividends: [] };

  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const prices = timestamps.map((t: number, i: number) => ({
    date: new Date(t * 1000).toISOString().split('T')[0],
    close: closes[i]
  })).filter((d: any) => d.close);

  const divs = result.events?.dividends || {};
  const dividends = Object.values(divs).map((d: any) => ({
    date: new Date(d.date * 1000).toISOString().split('T')[0],
    amount: d.amount
  }));

  return { prices, dividends };
}

export async function GET() {
  try {
    const [nvdaData, nhyData] = await Promise.all([getHistory('NVDA'), getHistory('NHY.OL')]);
    const NVDA_STRIKE = 178.88, NHY_STRIKE = 70.54;

    // Build cumulative dividend map
    function cumDivs(divs: any[]) {
      const sorted = [...divs].sort((a, b) => a.date.localeCompare(b.date));
      let cum = 0;
      return sorted.map(d => { cum += d.amount; return { date: d.date, cumulative: cum }; });
    }

    const nvdaCumDivs = cumDivs(nvdaData.dividends);
    const nhyCumDivs = cumDivs(nhyData.dividends);

    function getCumDiv(cumDivList: any[], date: string) {
      let val = 0;
      for (const d of cumDivList) {
        if (d.date <= date) val = d.cumulative;
        else break;
      }
      return val;
    }

    // Build aligned data points
    const points = nvdaData.prices.map((n: any) => {
      const nhyPoint = nhyData.prices.find((h: any) => {
        const nDate = new Date(n.date), hDate = new Date(h.date);
        return Math.abs(nDate.getTime() - hDate.getTime()) < 7 * 86400000;
      });
      if (!nhyPoint) return null;

      const nvdaDiv = getCumDiv(nvdaCumDivs, n.date);
      const nhyDiv = getCumDiv(nhyCumDivs, nhyPoint.date);

      const nvdaTotalRet = ((n.close + nvdaDiv - NVDA_STRIKE) / NVDA_STRIKE) * 100;
      const nhyTotalRet = ((nhyPoint.close + nhyDiv - NHY_STRIKE) / NHY_STRIKE) * 100;
      const nvdaPriceRet = ((n.close - NVDA_STRIKE) / NVDA_STRIKE) * 100;
      const nhyPriceRet = ((nhyPoint.close - NHY_STRIKE) / NHY_STRIKE) * 100;

      return {
        date: n.date,
        nvda: +nvdaTotalRet.toFixed(2),
        nhy: +nhyTotalRet.toFixed(2),
        nvdaPrice: +nvdaPriceRet.toFixed(2),
        nhyPrice: +nhyPriceRet.toFixed(2),
        nvdaDiv: +nvdaDiv.toFixed(4),
        nhyDiv: +nhyDiv.toFixed(2),
        spread: +(nhyTotalRet - nvdaTotalRet).toFixed(2)
      };
    }).filter(Boolean);

    return NextResponse.json({
      points,
      dividends: {
        nvda: nvdaData.dividends,
        nhy: nhyData.dividends
      }
    });
  } catch { return NextResponse.json({ points: [], dividends: { nvda: [], nhy: [] } }); }
}
