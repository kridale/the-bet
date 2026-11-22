"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { SETTLEMENT_TARGET, SPCX } from "@/lib/contract";
import {
  formatCalendar,
  formatCompactUsd,
  formatEt,
  formatMultiple,
  formatNok,
  formatShareCount,
  formatShort,
  formatSignedPct,
  formatSignedUsd,
  formatUsd,
  marketLabel,
  zonedTimeToUtc,
} from "@/lib/format";
import { settled } from "@/lib/settlement";
import type { SalesFundamentals, SpcxSnapshot } from "@/lib/types";

function Rocket({ className }: { className?: string }) {
  const raw = useId().replace(/:/g, "");
  const body = `${raw}-body`;
  const flame = `${raw}-flame`;
  return (
    <svg className={className} viewBox="0 0 120 320" aria-hidden="true">
      <defs>
        <linearGradient id={body} x1="0" x2="1">
          <stop offset="0" stopColor="#f7f4ee" />
          <stop offset="0.48" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c8c4bb" />
        </linearGradient>
        <linearGradient id={flame} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1c9" />
          <stop offset="0.4" stopColor="#ffb03a" />
          <stop offset="1" stopColor="#ff4d1a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="flame" d="M60 214c-16 28-22 58 0 98c22-40 16-70 0-98z" fill={`url(#${flame})`} />
      <path d="M40 198l-8 22h56l-8-22z" fill="#b7bcc6" />
      <path d="M38 92h44v108H38z" fill={`url(#${body})`} />
      <path d="M38 98L60 16l22 82z" fill={`url(#${body})`} />
      <circle cx="60" cy="124" r="9" fill="#12141a" />
      <circle cx="60" cy="124" r="4" fill="#49d6ff" />
      <path d="M38 156H18v26h20z" fill="#e6e1d8" />
      <path d="M82 156h20v26H82z" fill="#d4cfc6" />
      <path d="M38 176h44v8H38z" fill="#1b1e27" />
    </svg>
  );
}

function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const target = zonedTimeToUtc(
    SETTLEMENT_TARGET.year,
    SETTLEMENT_TARGET.month,
    SETTLEMENT_TARGET.day,
    SETTLEMENT_TARGET.hour,
    SETTLEMENT_TARGET.minute,
    SETTLEMENT_TARGET.timeZone
  );
  const remain = now == null ? null : Math.max(0, target - now);
  const parts = remain == null
    ? null
    : {
        d: Math.floor(remain / 86_400_000),
        h: Math.floor((remain % 86_400_000) / 3_600_000),
        m: Math.floor((remain % 3_600_000) / 60_000),
        s: Math.floor((remain % 60_000) / 1000),
      };
  const cell = (value: number | null, label: string) => (
    <div key={label}>
      <b>{value == null ? "––" : String(value).padStart(2, "0")}</b>
      <span>{label}</span>
    </div>
  );
  return (
    <div className="clock" aria-label="Countdown to the 19 November 2027 New York close">
      {cell(parts?.d ?? null, "Days")}
      {cell(parts?.h ?? null, "Hrs")}
      {cell(parts?.m ?? null, "Min")}
      {cell(parts?.s ?? null, "Sec")}
    </div>
  );
}

function aheadOf(price: number, strike: number) {
  const cents = Math.round(price * 100) - Math.round(strike * 100);
  if (cents < 0) return "wagon" as const;
  if (cents > 0) return "claw" as const;
  return "tie" as const;
}

function spreadLabels(items: { key: string; pct: number }[]) {
  const sorted = [...items].sort((a, b) => a.pct - b.pct).map((item) => ({ ...item }));
  const gap = 11;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].pct - sorted[i - 1].pct < gap) {
      const mid = (sorted[i].pct + sorted[i - 1].pct) / 2;
      sorted[i - 1].pct = mid - gap / 2;
      sorted[i].pct = mid + gap / 2;
    }
  }
  if (sorted.length && sorted[0].pct < 4) {
    const shift = 4 - sorted[0].pct;
    sorted.forEach((item) => { item.pct += shift; });
  }
  const last = sorted[sorted.length - 1];
  if (last && last.pct > 94) {
    const shift = last.pct - 94;
    sorted.forEach((item) => { item.pct -= shift; });
  }
  return Object.fromEntries(sorted.map((item) => [item.key, item.pct]));
}

function FlightPath({ price, strike, reference }: { price: number | null; strike: number; reference: number }) {
  const anchor = price ?? reference;
  const low = Math.min(anchor, reference, strike);
  const high = Math.max(anchor, reference, strike);
  const span = Math.max(high - low, 8);
  const min = low - span * 0.28;
  const max = high + span * 0.32;
  const pct = (value: number) => ((value - min) / (max - min)) * 100;
  const strikePct = pct(strike);
  const refPct = pct(reference);
  const pricePct = price == null ? null : pct(price);
  const labels = spreadLabels([
    { key: "strike", pct: strikePct },
    { key: "ref", pct: refPct },
    ...(pricePct == null ? [] : [{ key: "now", pct: pricePct }]),
  ]);

  const gap = price == null ? null : price - strike;
  const title = gap == null
    ? "No live fix"
    : gap < 0
      ? `${formatUsd(Math.abs(gap))} under the strike`
      : gap > 0
        ? `${formatUsd(gap)} over the strike`
        : "Sitting on the strike";

  return (
    <article className="panel">
      <p className="kicker">Flight path</p>
      <h2 className="track-title">{title}</h2>
      <p className="lede">
        {price == null
          ? "The gauge is waiting for a Yahoo quote. The strike stays $150.68. No price is filled in."
          : `${formatSignedPct((gap! / strike) * 100)} versus the ${formatUsd(strike)} strike. Cyan is under, flame is over.`}
      </p>
      <div className="gauge">
        <div
          className="rail"
          style={{
            background: `linear-gradient(to top, rgba(73,214,255,.95) 0%, rgba(73,214,255,.95) ${strikePct}%, rgba(255,138,42,.95) ${strikePct}%, rgba(255,138,42,.95) 100%)`,
          }}
        />
        <div className="mark ref" style={{ bottom: `${refPct}%` }} />
        <div className="mark strike" style={{ bottom: `${strikePct}%` }} />
        {pricePct != null && (
          <>
            <div className="now-dot" style={{ bottom: `${pricePct}%` }} />
            <div className="bird" style={{ bottom: `${pricePct}%` }}>
              <Rocket />
            </div>
          </>
        )}
        <div className="tlabel ref" style={{ bottom: `${labels.ref}%` }}>
          <b>{formatUsd(reference)}</b>
          <span>Ref 18 Nov</span>
        </div>
        <div className="tlabel strike" style={{ bottom: `${labels.strike}%` }}>
          <b>{formatUsd(strike)}</b>
          <span>Strike</span>
        </div>
        {price != null && pricePct != null && (
          <div className="tlabel now" style={{ bottom: `${labels.now}%` }}>
            <b>{formatUsd(price)}</b>
            <span>Now</span>
          </div>
        )}
      </div>
    </article>
  );
}

function PriceChart({ points, strike, reference }: { points: { date: string; close: number }[]; strike: number; reference: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const geometry = useMemo(() => {
    if (!points.length) return null;
    const values = points.map((point) => point.close).concat(strike, reference);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const span = Math.max(maxV - minV, 1);
    const lo = minV - span * 0.18;
    const hi = maxV + span * 0.32;
    const y = (value: number) => ((hi - value) / (hi - lo)) * 100;
    const x = (index: number) => (points.length === 1 ? 50 : (index / (points.length - 1)) * 100);
    return { lo, hi, y, x };
  }, [points, strike, reference]);

  if (!points.length || !geometry) {
    return <p className="missing">Daily closes since 18 Nov 2026 are unavailable. No line was invented.</p>;
  }

  const { lo, hi, y, x } = geometry;
  const active = hover ?? points.length - 1;
  const line = points.map((point, index) => `${x(index)},${y(point.close)}`).join(" ");
  const area = `0,100 ${points.map((point, index) => `${x(index)},${y(point.close)}`).join(" ")} 100,100`;
  const showDots = points.length <= 24;
  const labelIndexes = points.length <= 5
    ? points.map((_, index) => index)
    : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const ticks = [hi, (hi + lo) / 2, lo];

  return (
    <>
      <p className="readout">
        <b>{formatUsd(points[active].close)}</b> · {formatCalendar(points[active].date)}
      </p>
      <div className="legend">
        <span><i className="swatch" /> Close</span>
        <span><i className="swatch strike" /> Strike {formatUsd(strike)}</span>
        <span><i className="swatch ref" /> Ref {formatUsd(reference)}</span>
      </div>
      <div className="chart-body">
        <div className="ylabels">
          {ticks.map((tick) => {
            const top = y(tick);
            const style = top < 12
              ? { top: 0, transform: "none" }
              : top > 88
                ? { top: "auto", bottom: 0, transform: "none" }
                : { top: `${top}%` };
            return <span key={tick} style={style}>${Math.round(tick)}</span>;
          })}
        </div>
        <div
          className="plot"
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = (event.clientX - rect.left) / rect.width;
            const index = points.length === 1
              ? 0
              : Math.round(Math.min(1, Math.max(0, ratio)) * (points.length - 1));
            setHover(index);
          }}
          onPointerLeave={() => setHover(null)}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`SPCX daily closes from ${points[0].date} to ${points[points.length - 1].date}. Latest ${formatUsd(points[points.length - 1].close)}. Strike ${formatUsd(strike)}.`}>
            <polygon points={area} fill="rgba(73,214,255,0.13)" />
            <polyline points={line} fill="none" stroke="#f4f0e8" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="hline ref" style={{ top: `${y(reference)}%` }} />
          <div className="hline strike" style={{ top: `${y(strike)}%` }} />
          {points.map((point, index) => (
            (showDots || index === active) ? (
              <button
                key={point.date}
                type="button"
                className={index === active ? "dot active" : "dot"}
                style={{ left: `${x(index)}%`, top: `${y(point.close)}%` }}
                aria-label={`${formatCalendar(point.date)} ${formatUsd(point.close)}`}
                onClick={() => setHover(index)}
              />
            ) : null
          ))}
        </div>
      </div>
      <div className="xlabels">
        <span />
        <div className="xrow">
          {labelIndexes.map((index) => {
            const align = index === 0 ? "start" : index === points.length - 1 ? "end" : "mid";
            return (
              <span key={points[index].date} data-align={align} style={{ left: `${x(index)}%` }}>
                {formatShort(points[index].date)}
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}

function multipleAt(price: number, sales: Extract<SalesFundamentals, { ok: true }>) {
  return (price * sales.shares) / sales.ttmRevenue;
}

function SalesCard({
  price,
  strike,
  referencePrice,
  sales,
}: {
  price: number | null;
  strike: number;
  referencePrice: number;
  sales: SalesFundamentals | null;
}) {
  const ready = sales?.ok === true && price != null;
  const live = ready ? multipleAt(price, sales) : null;
  const cap = ready ? price * sales.shares : null;
  return (
    <section className="panel sales">
      <p className="kicker">Trailing sales</p>
      <h2 className="track-title">Price / sales</h2>
      <p className={live == null ? "ps missing" : "ps"}>{live == null ? "—" : formatMultiple(live)}</p>
      <p className="lede">
        {sales?.ok
          ? "Live price times shares, divided by trailing twelve-month revenue."
          : "P/S is unavailable. Shares outstanding or trailing revenue did not come back, so nothing here is filled in."}
      </p>
      {sales?.ok && (
        <>
          <div className="statgrid">
            <div>
              <span>Market cap</span>
              <strong>{cap == null ? "—" : formatCompactUsd(cap)}</strong>
            </div>
            <div>
              <span>TTM revenue</span>
              <strong>{formatCompactUsd(sales.ttmRevenue)}</strong>
            </div>
            <div>
              <span>Revenue through</span>
              <strong>{formatCalendar(sales.asOf)}</strong>
            </div>
            <div>
              <span>{sales.shareBasis === "implied" ? "Implied shares" : "Shares"}</span>
              <strong>{formatShareCount(sales.shares)}</strong>
            </div>
          </div>
          <div className="contextgrid">
            <div>
              <span>At the {formatUsd(strike)} strike</span>
              <strong>{formatMultiple(multipleAt(strike, sales))}</strong>
            </div>
            <div>
              <span>At the {formatUsd(referencePrice)} close</span>
              <strong>{formatMultiple(multipleAt(referencePrice, sales))}</strong>
            </div>
          </div>
          <p className="fine">
            The strike and 18 Nov 2026 figures use today’s share count and TTM revenue, not the multiple printed on those dates.
            Quarters: {sales.quarters.map((quarter) => `${formatCalendar(quarter.end)} ${formatCompactUsd(quarter.revenue)}`).join(" · ")}.
            {sales.secMatchedQuarters.length > 0
              ? ` ${sales.secMatchedQuarters.map((date) => formatCalendar(date)).join(" and ")} match the SEC filing.`
              : ""}
          </p>
          <p className="fine">
            <a href={sales.yahooUrl} target="_blank" rel="noreferrer">Yahoo key statistics</a>
            {sales.secFilingUrl && (
              <>
                {" · "}
                <a href={sales.secFilingUrl} target="_blank" rel="noreferrer">SEC filing</a>
              </>
            )}
          </p>
        </>
      )}
    </section>
  );
}

function money(amount: number, currency: "USD" | "NOK") {
  return currency === "USD" ? formatUsd(amount) : formatNok(amount);
}

export default function Board({ initial }: { initial: SpcxSnapshot }) {
  const [snap, setSnap] = useState(initial);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let cancel = false;
    const pull = async () => {
      try {
        const res = await fetch("/api/spcx", { cache: "no-store" });
        const data = (await res.json()) as SpcxSnapshot;
        if (cancel) return;
        if (data?.ok) {
          setSnap(data);
          setStale(false);
        } else {
          setStale(true);
        }
      } catch {
        if (!cancel) setStale(true);
      }
    };
    if (!initial.ok) pull();
    const id = window.setInterval(pull, 60_000);
    return () => {
      cancel = true;
      window.clearInterval(id);
    };
  }, [initial.ok]);

  const live = snap.ok ? snap : null;
  const strike = live?.strike ?? SPCX.strike;
  const leader = live ? aheadOf(live.price, strike) : null;
  const distance = live ? live.price - strike : null;
  const splitNote = live && live.splits.length
    ? `Strike adjusted for ${live.splits.map((split) => `${split.numerator}-for-${split.denominator} on ${formatCalendar(split.date)}`).join(", ")}. Contract strike was ${formatUsd(live.contractStrike)}.`
    : null;

  return (
    <main className="wrap" data-leader={leader ?? "none"}>
      <header className="top">
        <span className="brand">The Bet</span>
        <span>SPCX · Nasdaq</span>
      </header>

      <section className="hero">
        <div className="intro">
          <p className="kicker">
            <i className={live?.marketState === "OPEN" ? "dot on" : "dot"} />
            Active bet
          </p>
          <h1>SpaceX</h1>
          <p className="matchup">G-WAGON <i>vs</i> THE CLAW</p>
          <p className="company">{live?.name ?? "Space Exploration Technologies"} · SPCX</p>
        </div>
        <div className="hero-rocket">
          <Rocket />
        </div>
        <div className="quote-block">
          <div className="price-row">
            {live ? (
              <p className="price" aria-live="polite"><span>$</span>{live.price.toFixed(2)}</p>
            ) : (
              <p className="price missing">—</p>
            )}
          </div>
          <p className="asof">
            {live ? (
              <>
                {marketLabel(live.marketState)} · {formatEt(live.asOf)}
                {live.changePercent != null && (
                  <span className={live.changePercent >= 0 ? "pill up" : "pill down"}>
                    {formatSignedPct(live.changePercent)} {live.marketState === "OPEN" ? "today" : "on the day"}
                  </span>
                )}
              </>
            ) : (
              "Quote unavailable. The server could not reach Yahoo Finance."
            )}
          </p>
          <div className="metrics">
            <div className="metric">
              <span>Strike</span>
              <strong>{formatUsd(strike)}</strong>
            </div>
            <div className={`metric ${distance == null ? "flat" : distance < 0 ? "under" : distance > 0 ? "over" : "flat"}`}>
              <span>Distance</span>
              <strong>{distance == null ? "—" : `${formatSignedUsd(distance)}`}</strong>
            </div>
          </div>
          <p className={`call ${leader ?? "none"}`}>
            {leader === "wagon" && "G-WAGON leads"}
            {leader === "claw" && "THE CLAW leads"}
            {leader === "tie" && "Level with the strike"}
            {leader == null && "Waiting on a price"}
          </p>
          {distance != null && (
            <p className="ref-line">{formatSignedPct((distance / strike) * 100)} from the strike. Under is G-WAGON. Over is THE CLAW.</p>
          )}
          <Countdown />
          <p className="ref-line">
            Settles on the <strong>19 Nov 2027</strong> close, 16:00 New York.
            Reference <strong>{formatUsd(SPCX.referenceClose)}</strong> on 18 Nov 2026 × 1.05 = <strong>{formatUsd(SPCX.strike)}</strong>.
          </p>
          {splitNote && <p className="stale">{splitNote}</p>}
          {stale && live && <p className="stale">Live refresh missed. Showing the last quote.</p>}
        </div>
      </section>

      <div className="stack instruments">
        <FlightPath price={live?.price ?? null} strike={strike} reference={SPCX.referenceClose} />
        <div className="face">
          <article className={`side wagon ${leader === "wagon" ? "lead" : leader ? "trail" : ""}`}>
            <p className="role">Under</p>
            <h2>G-WAGON</h2>
            <p className="need">Wins if SPCX closes under {formatUsd(strike)}.</p>
            <p className="status">{leader === "wagon" ? "Leading" : leader === "tie" ? "On the strike" : leader === "claw" ? "Trailing" : "No quote"}</p>
          </article>
          <article className={`side claw ${leader === "claw" ? "lead" : leader ? "trail" : ""}`}>
            <p className="role">Over</p>
            <h2>THE CLAW</h2>
            <p className="need">Wins if SPCX closes over {formatUsd(strike)}.</p>
            <p className="status">{leader === "claw" ? "Leading" : leader === "tie" ? "On the strike" : leader === "wagon" ? "Trailing" : "No quote"}</p>
          </article>
        </div>
      </div>

      <SalesCard
        price={live?.price ?? null}
        strike={strike}
        referencePrice={live?.referencePrice ?? SPCX.referenceClose}
        sales={live?.sales ?? null}
      />

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="chart-head">
          <div>
            <p className="kicker">Tape</p>
            <h2 className="track-title">Since 18 Nov</h2>
          </div>
        </div>
        <p className="lede">Daily SPCX closes from the reference session. The orange line is the strike.</p>
        <PriceChart points={live?.history ?? []} strike={strike} reference={SPCX.referenceClose} />
      </section>

      <div className="stack bottom" style={{ marginTop: 16 }}>
        <article className="panel dinner">
          <p className="kicker">The stakes</p>
          <h2 className="dinner-name">Antoinetta</h2>
          <p className="dinner-line">Loser pays dinner.</p>
          <p className="dinner-sub">One table. Whoever is on the wrong side of the strike picks up the bill.</p>
        </article>
        <article className="panel terms">
          <p className="kicker">Ground rules</p>
          <h2 className="track-title">Fine print</h2>
          <ol>
            <li><strong>Settlement.</strong> SPCX’s official close on 19 November 2027, 16:00 America/New_York. G-WAGON is under. THE CLAW is over.</li>
            <li><strong>Strike.</strong> The 18 November 2026 close was $143.50. Five percent on top is $150.675, which rounds to $150.68.</li>
            <li><strong>A deal.</strong> If SPCX is exchanged for Tesla shares, or the company is acquired, the bet follows the consideration. In a share exchange the strike is divided by the exchange ratio (strike / ratio) and settlement moves to that new share’s close on 19 November 2027. In a cash takeover, the cash per share decides when the deal completes.</li>
            <li><strong>Splits.</strong> Splits and reverse splits adjust the strike by the same ratio. A 2-for-1 turns $150.68 into $75.34. Dividends do not move the strike.</li>
            <li><strong>A dead heat.</strong> A close printed exactly at the strike was not given a winner.</li>
          </ol>
        </article>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <p className="kicker">Hall of fame</p>
        <h2 className="track-title">Settled bets</h2>
        <p className="hall-flag">Finished · {formatCalendar(settled.nvda.settlement.date)}</p>
        <p className="bet-name">NVDA vs NHY</p>
        <p className="lede">Total return, dividends included. Each leg in its own currency — FX held constant. Struck {formatCalendar(settled.nvda.strike.date)}.</p>
        <div className="legs">
          {[settled.nvda, settled.nhy].map((leg) => {
            const won = settled.winner?.side === leg.side;
            return (
              <article key={leg.ticker} className={`leg ${leg.ticker === "NVDA" ? "claw" : "wagon"}${won ? " win" : ""}`}>
                <p className="tag">{leg.ticker} · {leg.exchange}</p>
                <h3>{leg.side}</h3>
                <p className="ret">{formatSignedPct(leg.totalReturn)}</p>
                <p className="lede">Total return</p>
                {won ? <span className="chip">Winner</span> : <span className="chip pay">Pays</span>}
                <div className="facts">
                  <div><span>Strike</span><strong>{money(leg.strike.close, leg.currency)}</strong></div>
                  <div><span>Close</span><strong>{money(leg.settlement.close, leg.currency)}</strong></div>
                  <div><span>Dividends</span><strong>{money(leg.dividendsTotal, leg.currency)}</strong></div>
                  <div><span>Price only</span><strong>{formatSignedPct(leg.priceReturn)}</strong></div>
                </div>
                <ul className="divs">
                  {leg.dividends.map((dividend) => (
                    <li key={dividend.exDate}>
                      Ex {formatCalendar(dividend.exDate)} · {money(dividend.amount, leg.currency)}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        <p className="verdict">
          <strong>{settled.winner?.side} wins</strong> by {Math.abs(settled.margin).toFixed(2)} percentage points. {settled.pays}.
        </p>
        <p className="fine">
          The original clock ran to 21 Nov 2026, 16:00 New York, a Saturday. These closes are the Friday 20 Nov 2026 prints, the last session on or before that instant. Unadjusted Yahoo closes, plus every dividend Yahoo lists with an ex-date inside the window.
        </p>
      </section>

      <footer>
        <p>
          Live SPCX quotes are read on the server from Yahoo Finance, then shown here, so the phone never calls Yahoo itself.
          {live ? ` Last print ${formatEt(live.asOf)}.` : ""}
        </p>
        <p>
          <a href="https://finance.yahoo.com/quote/SPCX/" target="_blank" rel="noreferrer">Yahoo: SPCX</a>
          {" · "}
          <a href="https://finance.yahoo.com/quote/NVDA/" target="_blank" rel="noreferrer">Yahoo: NVDA</a>
          {" · "}
          <a href="https://finance.yahoo.com/quote/NHY.OL/" target="_blank" rel="noreferrer">Yahoo: NHY</a>
        </p>
      </footer>
    </main>
  );
}
