# THE BET

A one-page scoreboard. The live bet is SpaceX (SPCX), G-WAGON under versus THE CLAW over. The NVDA versus NHY total-return bet is settled.

## NVDA vs NHY — final

Struck 21 Nov 2025. The original countdown ran to **21 Nov 2026, 16:00 America/New_York**, a Saturday. Settlement is the last official close on or before that instant: **Friday 20 Nov 2026**.

Total return is `(close + dividends − strike) / strike`, in each listing’s own currency. Closes are Yahoo’s unadjusted session prints, rounded to the cent. Dividends are every Yahoo ex-date after the strike close and on or before the settlement close.

| | Side | Strike | Close | Dividends | Total return |
| --- | --- | --- | --- | --- | --- |
| NVDA | THE CLAW | $178.88 | $125.53 | $0.52 | −29.53% |
| NHY.OL | G-WAGON | 70.54 NOK | 64.28 NOK | 3.00 NOK | −4.62% |

**G-WAGON wins** by 24.91 percentage points. **THE CLAW buys a full night at Le Benjamin.**

NVDA dividends: $0.01 (4 Dec 2025), $0.01 (11 Mar 2026), $0.25 (4 Jun 2026), $0.25 (10 Sep 2026).  
NHY dividend: 3.00 NOK (8 May 2026).

The raw prints, volumes, request URLs, and the rounding rule are in [`data/nvda-nhy-settlement.json`](data/nvda-nhy-settlement.json). Both Yahoo chart hosts (`query1` and `query2`) returned the same closes and dividends on 22 Nov 2026. Stooq answered with a bot check, so it is not used. Nothing in the table was estimated.

## SpaceX

- Reference: SPCX close on 18 Nov 2026 = **$143.50** (Yahoo, same file).
- Strike: 143.50 × 1.05 = 150.675, rounded to **$150.68**.
- Settles on the SPCX close on **19 Nov 2027**, 16:00 America/New_York.
- G-WAGON is under. THE CLAW is over. Loser pays dinner at Antoinetta.
- Splits adjust the strike by the same ratio. Dividends do not. A share exchange divides the strike by the exchange ratio. A cash takeover is decided by the deal price.

The page asks `/api/spcx`, which reads Yahoo’s chart API on the server. The browser never calls Yahoo, which is what was breaking the quote on a phone.

Price / sales (TTM) is the live price times shares, divided by trailing twelve-month revenue. Shares are Yahoo’s implied shares outstanding when that field is present, because that is the count behind Yahoo’s published market cap; otherwise the basic shares-outstanding field is used. Revenue is the sum of the latest four consecutive quarterly totals. A quarter reported in the SEC company-facts feed replaces the Yahoo quarter. The share count and revenue are cached for about an hour; the multiple is recomputed from the live price on each request. If either input is missing, the multiple is shown as a dash.
