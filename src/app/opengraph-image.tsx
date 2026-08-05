import { ImageResponse } from "next/og";
import { isPlatformApp } from "@/lib/app-mode";
import { getSiteBrand } from "@/lib/site-brand";

export const alt = "TeamAlum";
export const contentType = "image/png";
export const size = {
  height: 630,
  width: 1200,
};

export default function Image() {
  const brand = getSiteBrand();
  const platform = isPlatformApp();
  const title = platform ? "TEAMALUM" : brand.programName;
  const subtitle = platform
    ? "Alumni CRM + passive fundraising"
    : "Powered by TeamAlum";

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#fbfbf7",
          color: "#111417",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 82,
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#d8ff6a",
            borderRadius: 999,
            height: 270,
            left: 86,
            position: "absolute",
            top: 74,
            width: 270,
          }}
        />
        <div
          style={{
            border: "1px solid #d6d9d2",
            borderRadius: 999,
            bottom: 88,
            height: 190,
            position: "absolute",
            right: 98,
            width: 190,
          }}
        />
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 34,
            position: "relative",
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "#111417",
              borderRadius: 999,
              color: "white",
              display: "flex",
              fontSize: 72,
              fontWeight: 900,
              height: 178,
              justifyContent: "center",
              width: 178,
            }}
          >
            TA
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: platform ? 108 : 76,
                fontWeight: 900,
                lineHeight: 0.9,
              }}
            >
              {title}
            </div>
            <div
              style={{
                color: "#475569",
                display: "flex",
                fontSize: 38,
                fontWeight: 800,
                marginTop: 22,
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
