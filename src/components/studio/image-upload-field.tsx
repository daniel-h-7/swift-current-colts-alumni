"use client";

import { useEffect, useMemo, useState } from "react";

type ImageUploadFieldProps = {
  focusName?: string;
  focusValue?: string;
  help: string;
  label: string;
  name: string;
  previewMode: "logo" | "hero";
  urlName: string;
  urlValue: string;
};

function parseFocus(value?: string) {
  const match = value?.match(/^(\d{1,3})%\s+(\d{1,3})%$/);

  if (!match) {
    return { x: 50, y: 50 };
  }

  return {
    x: Math.min(100, Math.max(0, Number(match[1]))),
    y: Math.min(100, Math.max(0, Number(match[2]))),
  };
}

export function ImageUploadField({
  focusName,
  focusValue,
  help,
  label,
  name,
  previewMode,
  urlName,
  urlValue,
}: ImageUploadFieldProps) {
  const initialFocus = parseFocus(focusValue);
  const [previewUrl, setPreviewUrl] = useState(urlValue);
  const [selectedLogoDataUrl, setSelectedLogoDataUrl] = useState("");
  const [croppedLogoDataUrl, setCroppedLogoDataUrl] = useState("");
  const [focusX, setFocusX] = useState(initialFocus.x);
  const [focusY, setFocusY] = useState(initialFocus.y);
  const [logoZoom, setLogoZoom] = useState(100);
  const objectPosition = `${focusX}% ${focusY}%`;
  const isLogoCropper = previewMode === "logo" && selectedLogoDataUrl;
  const frameClass = useMemo(
    () =>
      previewMode === "hero"
        ? "aspect-[16/7] w-full overflow-hidden border border-slate-200 bg-slate-950"
        : "flex aspect-square w-36 items-center justify-center overflow-hidden border border-slate-200 bg-slate-950",
    [previewMode],
  );

  useEffect(() => {
    if (!isLogoCropper) {
      return;
    }

    let isCancelled = false;
    const image = new Image();

    image.onload = () => {
      if (isCancelled) {
        return;
      }

      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.clearRect(0, 0, size, size);

      const baseScale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
      const scale = baseScale * (logoZoom / 100);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const overflowX = Math.max(0, drawWidth - size);
      const overflowY = Math.max(0, drawHeight - size);
      const insetX = Math.max(0, size - drawWidth) / 2;
      const insetY = Math.max(0, size - drawHeight) / 2;
      const x = insetX - overflowX * (focusX / 100);
      const y = insetY - overflowY * (focusY / 100);

      context.drawImage(image, x, y, drawWidth, drawHeight);
      setCroppedLogoDataUrl(canvas.toDataURL("image/png"));
    };

    image.src = selectedLogoDataUrl;

    return () => {
      isCancelled = true;
    };
  }, [focusX, focusY, isLogoCropper, logoZoom, selectedLogoDataUrl]);

  return (
    <div className="space-y-3 text-sm font-bold text-slate-700 md:col-span-2">
      <div className="flex flex-col gap-1">
        <span>{label}</span>
        <span className="text-xs font-semibold leading-5 text-slate-500">
          {help}
        </span>
      </div>

      <div className={frameClass}>
        {croppedLogoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${label} cropped preview`}
            className="h-full w-full object-contain p-3"
            src={croppedLogoDataUrl}
          />
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${label} preview`}
            className={
              previewMode === "hero"
                ? "h-full w-full object-cover"
                : "max-h-full max-w-full object-contain p-3"
            }
            src={previewUrl}
            style={previewMode === "hero" ? { objectPosition } : undefined}
          />
        ) : (
          <span className="px-4 text-center text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Preview
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <label>
          Upload
          <input
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950"
            name={name}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                const fileUrl = URL.createObjectURL(file);
                setPreviewUrl(fileUrl);
                setCroppedLogoDataUrl("");

                if (previewMode === "logo" && file.type !== "image/svg+xml") {
                  const reader = new FileReader();

                  reader.onload = () => {
                    setSelectedLogoDataUrl(String(reader.result ?? ""));
                    setLogoZoom(100);
                    setFocusX(50);
                    setFocusY(50);
                  };

                  reader.readAsDataURL(file);
                } else {
                  setSelectedLogoDataUrl("");
                  setCroppedLogoDataUrl("");
                }
              }
            }}
            type="file"
          />
        </label>
        <label>
          Or paste image URL
          <input
            className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
            defaultValue={urlValue}
            name={urlName}
            onChange={(event) => {
              setPreviewUrl(event.target.value);
              setSelectedLogoDataUrl("");
              setCroppedLogoDataUrl("");
            }}
            placeholder="/images/stadium.jpg"
          />
        </label>
      </div>

      {isLogoCropper ? (
        <div className="grid gap-3 border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
          <input
            name={`${name}_cropped_data_url`}
            type="hidden"
            value={croppedLogoDataUrl}
          />
          <label>
            Logo size
            <input
              className="mt-2 w-full accent-emerald-700"
              max="220"
              min="60"
              onChange={(event) => setLogoZoom(Number(event.target.value))}
              type="range"
              value={logoZoom}
            />
          </label>
          <label>
            Horizontal position
            <input
              className="mt-2 w-full accent-emerald-700"
              max="100"
              min="0"
              onChange={(event) => setFocusX(Number(event.target.value))}
              type="range"
              value={focusX}
            />
          </label>
          <label>
            Vertical position
            <input
              className="mt-2 w-full accent-emerald-700"
              max="100"
              min="0"
              onChange={(event) => setFocusY(Number(event.target.value))}
              type="range"
              value={focusY}
            />
          </label>
          <p className="text-xs font-semibold leading-5 text-slate-500 md:col-span-3">
            This saves a square PNG version of the logo so it fits cleanly in
            headers, previews, and app-style placements.
          </p>
        </div>
      ) : null}

      {focusName ? (
        <div className="grid gap-3 border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
          <input name={focusName} type="hidden" value={objectPosition} />
          <label>
            Horizontal focus
            <input
              className="mt-2 w-full accent-emerald-700"
              max="100"
              min="0"
              onChange={(event) => setFocusX(Number(event.target.value))}
              type="range"
              value={focusX}
            />
          </label>
          <label>
            Vertical focus
            <input
              className="mt-2 w-full accent-emerald-700"
              max="100"
              min="0"
              onChange={(event) => setFocusY(Number(event.target.value))}
              type="range"
              value={focusY}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
