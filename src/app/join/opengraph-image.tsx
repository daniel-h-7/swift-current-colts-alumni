import { ImageResponse } from "next/og";

export const alt = "Support Swift Current Colts Football";
export const contentType = "image/png";
export const size = {
  height: 630,
  width: 1200,
};

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #030712 0%, #061741 42%, #111827 58%, #450a0a 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 72,
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            border: "2px solid rgba(255,255,255,0.16)",
            borderRadius: 32,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            padding: 64,
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#f87171",
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: 8,
              textTransform: "uppercase",
            }}
          >
            Swift Current Colts Football
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 900,
              letterSpacing: -2,
              lineHeight: 1,
              marginTop: 26,
              maxWidth: 850,
            }}
          >
            Support the Legacy Today
          </div>
          <div
            style={{
              color: "#d1d5db",
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.28,
              marginTop: 34,
              maxWidth: 920,
            }}
          >
            Alumni and boosters can make a lasting impact on our young
            student-athletes.
          </div>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 18,
              marginTop: 46,
            }}
          >
            <div
              style={{
                background: "#dc2626",
                borderRadius: 999,
                height: 18,
                width: 160,
              }}
            />
            <div
              style={{
                background: "#2563eb",
                borderRadius: 999,
                height: 18,
                width: 160,
              }}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
