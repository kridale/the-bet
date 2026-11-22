import { ImageResponse } from "next/og";

export const alt = "THE BET — SpaceX, Herman under versus Dale over. Strike $150.68. Loser pays dinner at Antoinetta.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#07080c",
          color: "#f4f0e8",
          padding: "52px 60px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", color: "#ff8a2a", fontSize: 24, letterSpacing: 6 }}>
          <div>THE BET</div>
          <div>19 NOV 2027</div>
        </div>
        <div style={{ display: "flex", fontSize: 108, fontWeight: 700, letterSpacing: -3, marginTop: 22, lineHeight: 0.9 }}>
          SPACEX
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#cfc8bc", marginTop: 6 }}>
          Herman vs Dale
        </div>
        <div style={{ display: "flex", marginTop: 34, gap: 22 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              border: "3px solid #49d6ff",
              borderRadius: 22,
              padding: "22px 26px",
            }}
          >
            <div style={{ display: "flex", color: "#49d6ff", fontSize: 20, letterSpacing: 4 }}>UNDER</div>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 700, marginTop: 6 }}>HERMAN</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              border: "3px solid #ff8a2a",
              borderRadius: 22,
              padding: "22px 26px",
            }}
          >
            <div style={{ display: "flex", color: "#ff8a2a", fontSize: 20, letterSpacing: 4 }}>OVER</div>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 700, marginTop: 6 }}>DALE</div>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 36, justifyContent: "space-between", fontSize: 30 }}>
          <div>Strike $150.68</div>
          <div style={{ display: "flex", color: "#e7c27a" }}>Loser pays dinner at Antoinetta</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
