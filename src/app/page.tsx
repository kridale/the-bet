'use client';
import { useState, useEffect } from 'react';

function Countdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const end = new Date('2026-11-21T16:00:00-05:00').getTime();
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setT({ d: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  const B = ({ v, l }: { v: number; l: string }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>{String(v).padStart(2,'0')}</div>
      <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: 2 }}>{l}</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', margin: '16px 0' }}>
      <B v={t.d} l="Days" /><div style={{ fontSize: '2rem', color: '#333', alignSelf: 'center' }}>:</div>
      <B v={t.h} l="Hrs" /><div style={{ fontSize: '2rem', color: '#333', alignSelf: 'center' }}>:</div>
      <B v={t.m} l="Min" /><div style={{ fontSize: '2rem', color: '#333', alignSelf: 'center' }}>:</div>
      <B v={t.s} l="Sec" />
    </div>
  );
}

function Card({ name, ticker, exchange, strike, price, ret, day, color, leading }: any) {
  const sign = ret >= 0 ? '+' : '';
  const daySign = day >= 0 ? '+' : '';
  return (
    <div style={{ flex: 1, background: '#111', border: `1px solid ${leading ? color : '#222'}`, borderRadius: 12, padding: 24, position: 'relative', boxShadow: leading ? `0 0 30px ${color}33` : 'none' }}>
      {leading && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: color, color: '#000', padding: '4px 16px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1 }}>LEADING</div>}
      <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>{ticker} <span style={{ fontSize: '0.7rem', color: '#555' }}>{exchange}</span></div>
      <div style={{ margin: '16px 0', padding: '16px 0', borderTop: '1px solid #222', borderBottom: '1px solid #222' }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{sign}{ret.toFixed(2)}%</div>
        <div style={{ fontSize: '0.7rem', color: '#666' }}>Total Return</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.8rem' }}>
        <div><span style={{ color: '#666' }}>Strike</span><br/><span style={{ color: '#fff' }}>{ticker === 'NVDA' ? '$' : ''}{strike}{ticker === 'NHY' ? ' NOK' : ''}</span></div>
        <div><span style={{ color: '#666' }}>Current</span><br/><span style={{ color: '#fff' }}>{ticker === 'NVDA' ? '$' : ''}{price?.toFixed(2) || '—'}{ticker === 'NHY' ? ' NOK' : ''}</span></div>
        <div><span style={{ color: '#666' }}>Today</span><br/><span style={{ color: day >= 0 ? '#00ff88' : '#ff4444' }}>{daySign}{day.toFixed(2)}%</span></div>
      </div>
    </div>
  );
}

function SpreadBar({ history }: { history: any[] }) {
  if (!history.length) return null;
  const max = Math.max(...history.map(h => Math.abs(h.spread)), 1);
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, marginTop: 24 }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Performance Spread <span style={{ color: '#666', fontWeight: 400, fontSize: '0.75rem' }}>NHY return - NVDA return</span></h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
        {history.slice(-30).map((h: any, i: number) => {
          const height = (Math.abs(h.spread) / max) * 100;
          return <div key={i} title={`${h.date}: ${h.spread > 0 ? '+' : ''}${h.spread}pp`} style={{ flex: 1, height: `${height}%`, background: h.spread >= 0 ? '#00ff88' : '#ff4444', borderRadius: '2px 2px 0 0', minHeight: 2, opacity: 0.6 + (i / 40) }} />;
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.65rem', color: '#555' }}>
        <span>{history[Math.max(0, history.length - 30)]?.date}</span>
        <span>{history[history.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [updated, setUpdated] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockRes, histRes] = await Promise.all([fetch('/api/stocks'), fetch('/api/history')]);
        const stocks = await stockRes.json();
        const hist = await histRes.json();
        if (!stocks.error) { setData(stocks); setUpdated(new Date().toLocaleString()); }
        if (Array.isArray(hist)) setHistory(hist);
      } catch {}
    };
    fetchData();
    const i = setInterval(fetchData, 60000);
    return () => clearInterval(i);
  }, []);

  const nvdaLeading = data && data.leader === 'THE CLAW';
  const nhyLeading = data && data.leader === 'G-WAGON';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
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
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Card name="THE CLAW" ticker="NVDA" exchange="NASDAQ" strike={data?.nvda?.strike || 178.88} price={data?.nvda?.price} ret={data?.nvda?.return || 0} day={data?.nvda?.dayChange || 0} color="#4488ff" leading={nvdaLeading} />
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#333' }}>VS</div>
        <Card name="G-WAGON" ticker="NHY" exchange="OSLO" strike={data?.nhy?.strike || 70.54} price={data?.nhy?.price} ret={data?.nhy?.return || 0} day={data?.nhy?.dayChange || 0} color="#00ff88" leading={nhyLeading} />
      </div>
      <SpreadBar history={history} />
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, marginTop: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 12 }}>The Stakes</h3>
        <p style={{ color: '#ccc', fontSize: '0.9rem' }}>Loser buys a full night at <strong style={{ color: '#ffd700' }}>Le Benjamin</strong></p>
      </div>
      <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.7rem', color: '#444' }}>
        <p>Strike Date: November 21, 2025 · Settlement: November 2026 · Measure: Total Return · FX: Constant</p>
        <p style={{ marginTop: 8 }}>
          <a href="https://finance.yahoo.com/quote/NVDA/" target="_blank" style={{ color: '#4488ff', marginRight: 16 }}>Yahoo: NVDA</a>
          <a href="https://finance.yahoo.com/quote/NHY.OL/" target="_blank" style={{ color: '#00ff88' }}>Yahoo: NHY</a>
        </p>
        {updated && <p style={{ marginTop: 8, color: '#333' }}>Last updated: {updated}</p>}
      </div>
    </div>
  );
}
