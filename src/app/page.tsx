'use client';
import { useState, useEffect } from 'react';

// ─── KEY EVENTS TIMELINE ───
const KEY_EVENTS = [
  { date: '2025-11-21', label: 'Bet Struck', desc: 'NVDA $178.88 vs NHY 70.54 NOK', color: '#ffd700' },
  { date: '2025-12-18', label: 'NVDA Earnings Q3', desc: 'Fiscal Q3 2026 results', color: '#4488ff' },
  { date: '2026-02-04', label: 'NHY Q4 Results', desc: 'Hydro Q4 2025 earnings', color: '#00ff88' },
  { date: '2026-02-26', label: 'NVDA Earnings Q4', desc: 'Fiscal Q4 2026 results', color: '#4488ff' },
  { date: '2026-04-23', label: 'NHY Q1 Results', desc: 'Hydro Q1 2026 earnings', color: '#00ff88' },
  { date: '2026-05-28', label: 'NVDA Earnings Q1', desc: 'Fiscal Q1 2027 results', color: '#4488ff' },
  { date: '2026-05-13', label: 'NHY Ex-Dividend', desc: 'Spring dividend payment', color: '#00ff88' },
  { date: '2026-07-22', label: 'NHY Q2 Results', desc: 'Hydro Q2 2026 earnings', color: '#00ff88' },
];

// ─── COUNTDOWN ───
function Countdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const end = new Date('2026-11-21T16:00:00-05:00').getTime();
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setT({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, []);
  const B = ({ v, l }: { v: number; l: string }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>{String(v).padStart(2, '0')}</div>
      <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: 2 }}>{l}</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', margin: '12px 0' }}>
      <B v={t.d} l="Days" /><div style={{ fontSize: '1.8rem', color: '#333', alignSelf: 'center' }}>:</div>
      <B v={t.h} l="Hrs" /><div style={{ fontSize: '1.8rem', color: '#333', alignSelf: 'center' }}>:</div>
      <B v={t.m} l="Min" /><div style={{ fontSize: '1.8rem', color: '#333', alignSelf: 'center' }}>:</div>
      <B v={t.s} l="Sec" />
    </div>
  );
}

// ─── STOCK CARD ───
function Card({ name, ticker, exchange, strike, price, totalReturn, priceReturn, day, dividends, color, leading }: any) {
  const sign = (v: number) => v >= 0 ? '+' : '';
  const divYield = dividends?.total ? ((dividends.total / strike) * 100) : 0;
  return (
    <div style={{ flex: 1, minWidth: 280, background: '#111', border: `1px solid ${leading ? color : '#222'}`, borderRadius: 12, padding: 24, position: 'relative', boxShadow: leading ? `0 0 30px ${color}33` : 'none' }}>
      {leading && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: color, color: '#000', padding: '4px 16px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1 }}>LEADING</div>}
      <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>{ticker} <span style={{ fontSize: '0.7rem', color: '#555' }}>{exchange}</span></div>
      <div style={{ margin: '16px 0', padding: '16px 0', borderTop: '1px solid #222', borderBottom: '1px solid #222' }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{sign(totalReturn)}{totalReturn.toFixed(2)}%</div>
        <div style={{ fontSize: '0.7rem', color: '#666' }}>Total Return (incl. dividends)</div>
      </div>
      {/* Return breakdown */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#666', marginBottom: 2 }}>Price</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: priceReturn >= 0 ? '#00ff88' : '#ff4444' }}>{sign(priceReturn)}{priceReturn.toFixed(1)}%</div>
        </div>
        <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#666', marginBottom: 2 }}>Dividends</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffd700' }}>+{divYield.toFixed(1)}%</div>
        </div>
        <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#666', marginBottom: 2 }}>Today</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: day >= 0 ? '#00ff88' : '#ff4444' }}>{sign(day)}{day.toFixed(2)}%</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.8rem' }}>
        <div><span style={{ color: '#666' }}>Strike</span><br /><span style={{ color: '#fff' }}>{ticker === 'NVDA' ? '$' : ''}{strike}{ticker === 'NHY' ? ' NOK' : ''}</span></div>
        <div><span style={{ color: '#666' }}>Current</span><br /><span style={{ color: '#fff' }}>{ticker === 'NVDA' ? '$' : ''}{price?.toFixed(2) || '—'}{ticker === 'NHY' ? ' NOK' : ''}</span></div>
        {dividends && <div style={{ gridColumn: '1 / -1' }}>
          <span style={{ color: '#666' }}>Dividends Collected</span><br />
          <span style={{ color: '#ffd700' }}>{ticker === 'NVDA' ? '$' : ''}{dividends.total.toFixed(2)}{ticker === 'NHY' ? ' NOK' : ''}</span>
          <span style={{ color: '#555', fontSize: '0.7rem' }}> ({dividends.count} payment{dividends.count !== 1 ? 's' : ''})</span>
        </div>}
      </div>
    </div>
  );
}

// ─── PERFORMANCE CHART (SVG) ───
function PerformanceChart({ history }: { history: any[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!history.length) return null;

  const W = 760, H = 300, PAD = { top: 30, right: 20, bottom: 40, left: 55 };
  const cW = W - PAD.left - PAD.right, cH = H - PAD.top - PAD.bottom;

  const allVals = history.flatMap(h => [h.nvda, h.nhy]);
  const minV = Math.min(...allVals), maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  const padded = { min: minV - range * 0.1, max: maxV + range * 0.1 };

  const x = (i: number) => PAD.left + (i / (history.length - 1)) * cW;
  const y = (v: number) => PAD.top + cH - ((v - padded.min) / (padded.max - padded.min)) * cH;

  const line = (key: string) => history.map((h: any, i: number) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(h[key]).toFixed(1)}`).join(' ');
  const area = (key: string) => line(key) + ` L${x(history.length - 1)},${y(0) > H - PAD.bottom ? H - PAD.bottom : y(0)} L${x(0)},${y(0) > H - PAD.bottom ? H - PAD.bottom : y(0)} Z`;

  // Zero line
  const zeroY = y(0);
  const showZero = zeroY > PAD.top && zeroY < H - PAD.bottom;

  // Grid lines
  const gridCount = 5;
  const gridStep = (padded.max - padded.min) / gridCount;

  // Match events to chart points
  const eventMarkers = KEY_EVENTS.map(ev => {
    const idx = history.findIndex(h => h.date >= ev.date);
    if (idx < 0) return null;
    return { ...ev, idx, x: x(idx), nvdaY: y(history[idx].nvda), nhyY: y(history[idx].nhy) };
  }).filter(Boolean);

  const hoverData = hover !== null ? history[hover] : null;

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Total Return Performance</h3>
        <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem' }}>
          <span><span style={{ color: '#4488ff' }}>●</span> NVDA</span>
          <span><span style={{ color: '#00ff88' }}>●</span> NHY</span>
          <span style={{ color: '#666' }}>incl. dividends</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = ((e.clientX - rect.left) / rect.width) * W;
          const idx = Math.round(((mx - PAD.left) / cW) * (history.length - 1));
          setHover(Math.max(0, Math.min(history.length - 1, idx)));
        }}
        onMouseLeave={() => setHover(null)}>
        {/* Grid */}
        {Array.from({ length: gridCount + 1 }).map((_, i) => {
          const val = padded.min + i * gridStep;
          const gy = y(val);
          return <g key={i}>
            <line x1={PAD.left} y1={gy} x2={W - PAD.right} y2={gy} stroke="#1a1a1a" strokeWidth="1" />
            <text x={PAD.left - 8} y={gy + 4} fill="#555" fontSize="10" textAnchor="end">{val.toFixed(0)}%</text>
          </g>;
        })}
        {/* Zero line */}
        {showZero && <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="#333" strokeWidth="1" strokeDasharray="4,4" />}
        {/* Area fills */}
        <path d={area('nvda')} fill="#4488ff08" />
        <path d={area('nhy')} fill="#00ff8808" />
        {/* Lines */}
        <path d={line('nvda')} fill="none" stroke="#4488ff" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={line('nhy')} fill="none" stroke="#00ff88" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Event markers */}
        {eventMarkers.map((ev: any, i: number) => (
          <g key={i}>
            <line x1={ev.x} y1={PAD.top} x2={ev.x} y2={H - PAD.bottom} stroke={ev.color} strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />
            <circle cx={ev.x} cy={PAD.top - 4} r="3" fill={ev.color} opacity="0.6" />
          </g>
        ))}
        {/* Date labels */}
        {history.filter((_: any, i: number) => i % Math.max(1, Math.floor(history.length / 6)) === 0 || i === history.length - 1).map((h: any, i: number) => {
          const idx = history.indexOf(h);
          return <text key={i} x={x(idx)} y={H - 10} fill="#555" fontSize="9" textAnchor="middle">{h.date.slice(5)}</text>;
        })}
        {/* Hover */}
        {hover !== null && <>
          <line x1={x(hover)} y1={PAD.top} x2={x(hover)} y2={H - PAD.bottom} stroke="#444" strokeWidth="1" />
          <circle cx={x(hover)} cy={y(history[hover].nvda)} r="4" fill="#4488ff" stroke="#111" strokeWidth="2" />
          <circle cx={x(hover)} cy={y(history[hover].nhy)} r="4" fill="#00ff88" stroke="#111" strokeWidth="2" />
        </>}
      </svg>
      {/* Hover tooltip */}
      {hoverData && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8, fontSize: '0.8rem', padding: '8px 16px', background: '#0a0a0a', borderRadius: 8 }}>
          <span style={{ color: '#888' }}>{hoverData.date}</span>
          <span>NVDA: <strong style={{ color: '#4488ff' }}>{hoverData.nvda > 0 ? '+' : ''}{hoverData.nvda}%</strong></span>
          <span>NHY: <strong style={{ color: '#00ff88' }}>{hoverData.nhy > 0 ? '+' : ''}{hoverData.nhy}%</strong></span>
          <span>Spread: <strong style={{ color: hoverData.spread >= 0 ? '#00ff88' : '#ff4444' }}>{hoverData.spread > 0 ? '+' : ''}{hoverData.spread}pp</strong></span>
        </div>
      )}
    </div>
  );
}

// ─── SPREAD CHART ───
function SpreadChart({ history }: { history: any[] }) {
  if (!history.length) return null;
  const W = 760, H = 140, PAD = { top: 20, right: 20, bottom: 30, left: 55 };
  const cW = W - PAD.left - PAD.right, cH = H - PAD.top - PAD.bottom;

  const spreads = history.map(h => h.spread);
  const maxAbs = Math.max(...spreads.map(Math.abs), 1);

  const x = (i: number) => PAD.left + (i / (history.length - 1)) * cW;
  const y = (v: number) => PAD.top + cH / 2 - (v / maxAbs) * (cH / 2);
  const zeroY = PAD.top + cH / 2;

  const areaPos = history.map((h: any, i: number) => {
    const sv = Math.max(0, h.spread);
    return `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(sv).toFixed(1)}`;
  }).join(' ') + ` L${x(history.length - 1)},${zeroY} L${x(0)},${zeroY} Z`;

  const areaNeg = history.map((h: any, i: number) => {
    const sv = Math.min(0, h.spread);
    return `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(sv).toFixed(1)}`;
  }).join(' ') + ` L${x(history.length - 1)},${zeroY} L${x(0)},${zeroY} Z`;

  const latest = history[history.length - 1];

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
          Spread <span style={{ color: '#666', fontWeight: 400, fontSize: '0.75rem' }}>NHY − NVDA total return</span>
        </h3>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: latest.spread >= 0 ? '#00ff88' : '#ff4444' }}>
          {latest.spread > 0 ? '+' : ''}{latest.spread}pp
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="#333" strokeWidth="1" />
        <text x={PAD.left - 8} y={y(maxAbs) + 4} fill="#555" fontSize="9" textAnchor="end">+{maxAbs.toFixed(0)}pp</text>
        <text x={PAD.left - 8} y={y(-maxAbs) + 4} fill="#555" fontSize="9" textAnchor="end">-{maxAbs.toFixed(0)}pp</text>
        <path d={areaPos} fill="#00ff8822" />
        <path d={areaNeg} fill="#ff444422" />
        {/* Spread line */}
        <path d={history.map((h: any, i: number) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(h.spread).toFixed(1)}`).join(' ')} fill="none" stroke={latest.spread >= 0 ? '#00ff88' : '#ff4444'} strokeWidth="2" />
        {/* Labels */}
        <text x={W - PAD.right} y={zeroY - 8} fill="#00ff8888" fontSize="9" textAnchor="end">NHY leads ↑</text>
        <text x={W - PAD.right} y={zeroY + 16} fill="#ff444488" fontSize="9" textAnchor="end">NVDA leads ↓</text>
      </svg>
    </div>
  );
}

// ─── EVENTS TIMELINE ───
function EventsTimeline({ dividends }: { dividends: any }) {
  const today = new Date().toISOString().split('T')[0];

  // Merge key events with dividend events
  const allEvents = [
    ...KEY_EVENTS.map(e => ({ ...e, type: 'event' })),
    ...(dividends?.nhy || []).map((d: any) => ({
      date: d.date, label: `NHY Dividend`, desc: `${d.amount.toFixed(2)} NOK per share`, color: '#ffd700', type: 'dividend'
    })),
    ...(dividends?.nvda || []).map((d: any) => ({
      date: d.date, label: `NVDA Dividend`, desc: `$${d.amount.toFixed(4)} per share`, color: '#ffd700', type: 'dividend'
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  // Deduplicate by date+label
  const seen = new Set();
  const events = allEvents.filter(e => {
    const key = e.date + e.label;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, marginTop: 24 }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Key Events</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {events.map((ev, i) => {
          const isPast = ev.date <= today;
          return (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 0', borderLeft: `2px solid ${isPast ? ev.color : '#333'}`, paddingLeft: 16, opacity: isPast ? 1 : 0.5, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -5, top: 12, width: 8, height: 8, borderRadius: '50%', background: isPast ? ev.color : '#333' }} />
              <div style={{ minWidth: 80, fontSize: '0.75rem', color: '#666', fontVariantNumeric: 'tabular-nums' }}>{ev.date.slice(5)}</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isPast ? '#fff' : '#666' }}>
                  {ev.type === 'dividend' && <span style={{ color: '#ffd700', marginRight: 6 }}>💰</span>}
                  {ev.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#555' }}>{ev.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function Home() {
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [dividends, setDividends] = useState<any>(null);
  const [updated, setUpdated] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockRes, histRes] = await Promise.all([fetch('/api/stocks'), fetch('/api/history')]);
        const stocks = await stockRes.json();
        const hist = await histRes.json();
        if (!stocks.error) { setData(stocks); setUpdated(new Date().toLocaleString()); }
        if (hist.points) { setHistory(hist.points); setDividends(hist.dividends); }
      } catch { }
    };
    fetchData();
    const i = setInterval(fetchData, 60000);
    return () => clearInterval(i);
  }, []);

  const nvdaLeading = data && data.leader === 'THE CLAW';
  const nhyLeading = data && data.leader === 'G-WAGON';

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, background: 'linear-gradient(135deg, #ffd700, #ff6b6b, #4488ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 4, marginBottom: 8 }}>THE BET</h1>
        <p style={{ color: '#666', fontSize: '0.85rem', letterSpacing: 2 }}>NVDA vs NHY — TOTAL RETURN SHOWDOWN</p>
        <Countdown />
        {data && <div style={{ background: nhyLeading ? '#00ff8811' : '#4488ff11', border: `1px solid ${nhyLeading ? '#00ff8833' : '#4488ff33'}`, borderRadius: 8, padding: '8px 16px', display: 'inline-block', marginTop: 8 }}>
          <span style={{ color: nhyLeading ? '#00ff88' : '#4488ff', fontWeight: 700 }}>{data.leader}</span>
          <span style={{ color: '#888' }}> leads by </span>
          <span style={{ color: '#fff', fontWeight: 700 }}>{Math.abs(data.spread).toFixed(2)}pp</span>
        </div>}
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Card name="THE CLAW" ticker="NVDA" exchange="NASDAQ" strike={data?.nvda?.strike || 178.88} price={data?.nvda?.price} totalReturn={data?.nvda?.totalReturn || 0} priceReturn={data?.nvda?.priceReturn || 0} day={data?.nvda?.dayChange || 0} dividends={data?.nvda?.dividends} color="#4488ff" leading={nvdaLeading} />
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#333' }}>VS</div>
        <Card name="G-WAGON" ticker="NHY" exchange="OSLO" strike={data?.nhy?.strike || 70.54} price={data?.nhy?.price} totalReturn={data?.nhy?.totalReturn || 0} priceReturn={data?.nhy?.priceReturn || 0} day={data?.nhy?.dayChange || 0} dividends={data?.nhy?.dividends} color="#00ff88" leading={nhyLeading} />
      </div>

      {/* Charts */}
      <PerformanceChart history={history} />
      <SpreadChart history={history} />

      {/* Events Timeline */}
      <EventsTimeline dividends={dividends} />

      {/* Stakes */}
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, marginTop: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 12 }}>The Stakes</h3>
        <p style={{ color: '#ccc', fontSize: '0.9rem' }}>Loser buys a full night at <strong style={{ color: '#ffd700' }}>Le Benjamin</strong></p>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.7rem', color: '#444' }}>
        <p>Strike Date: November 21, 2025 · Settlement: November 2026 · Measure: Total Return (incl. dividends) · FX: Constant</p>
        <p style={{ marginTop: 8 }}>
          <a href="https://finance.yahoo.com/quote/NVDA/" target="_blank" style={{ color: '#4488ff', marginRight: 16 }}>Yahoo: NVDA</a>
          <a href="https://finance.yahoo.com/quote/NHY.OL/" target="_blank" style={{ color: '#00ff88' }}>Yahoo: NHY</a>
        </p>
        {updated && <p style={{ marginTop: 8, color: '#333' }}>Last updated: {updated}</p>}
      </div>
    </div>
  );
}
