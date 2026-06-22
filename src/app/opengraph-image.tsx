import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Soroban Contract Explorer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <svg
          viewBox="0 0 32 32"
          width={80}
          height={80}
          style={{ marginBottom: 24 }}
        >
          <polygon
            points="16,2 20,12 31,12 22,19 25,30 16,23 7,30 10,19 1,12 12,12"
            fill="#7B2FBE"
          />
        </svg>
        <div
          style={{
            width: 64,
            height: 3,
            background: "#7B2FBE",
            borderRadius: 2,
            marginBottom: 32,
          }}
        />
        <div style={{ fontSize: 64, fontWeight: 700, color: "#ffffff", marginBottom: 16 }}>
          Soroban Contract Explorer
        </div>
        <div style={{ fontSize: 28, color: "#a0aec0" }}>
          Interact with Stellar smart contracts without writing code
        </div>
      </div>
    ),
    { ...size }
  );
}
