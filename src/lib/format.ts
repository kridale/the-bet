export function formatUsd(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNok(n: number) {
  return (
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " NOK"
  );
}

export function formatSignedUsd(n: number) {
  const abs = formatUsd(Math.abs(n));
  if (n < 0) return "−" + abs;
  if (n > 0) return "+" + abs;
  return abs;
}

export function formatSignedPct(n: number, digits = 2) {
  const body = Math.abs(n).toFixed(digits) + "%";
  if (n < 0) return "−" + body;
  if (n > 0) return "+" + body;
  return body;
}

export function formatCalendar(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, (m ?? 1) - 1, d)));
}

export function formatEt(iso: string) {
  const when = new Date(iso);
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/New_York",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(when);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(when);
  return `${date}, ${time} ET`;
}

export function marketLabel(state: "OPEN" | "PRE" | "POST" | "CLOSED") {
  if (state === "OPEN") return "Live";
  if (state === "PRE") return "Pre-market";
  if (state === "POST") return "After hours";
  return "Last close";
}

/** UTC milliseconds for a wall-clock time in an IANA zone. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offsetAt = (ms: number) => {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
        .formatToParts(new Date(ms))
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value])
    );
    let h = Number(parts.hour);
    if (h === 24) h = 0;
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      h,
      Number(parts.minute),
      Number(parts.second)
    );
    return asUtc - ms;
  };
  const first = utcGuess - offsetAt(utcGuess);
  return utcGuess - offsetAt(first);
}

export function sumMoney(amounts: number[]) {
  return Math.round(amounts.reduce((sum, n) => sum + n, 0) * 100) / 100;
}
