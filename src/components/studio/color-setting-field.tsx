"use client";

import { useMemo, useState } from "react";

type ColorSettingFieldProps = {
  fallback: string;
  label: string;
  name: string;
  placeholder: string;
  value: string;
};

function normalizePickerValue(value: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export function ColorSettingField({
  fallback,
  label,
  name,
  placeholder,
  value,
}: ColorSettingFieldProps) {
  const initialValue = value || fallback;
  const [color, setColor] = useState(initialValue);
  const pickerValue = useMemo(
    () => normalizePickerValue(color, fallback),
    [color, fallback],
  );

  return (
    <label className="text-sm font-bold text-slate-700">
      {label}
      <div className="mt-2 grid grid-cols-[56px_minmax(0,1fr)] border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25">
        <input
          aria-label={`${label} picker`}
          className="h-full min-h-12 w-full border-r border-slate-300 bg-white p-1"
          onChange={(event) => setColor(event.target.value)}
          type="color"
          value={pickerValue}
        />
        <input
          className="min-w-0 px-4 py-3 text-slate-950 outline-none"
          name={name}
          onChange={(event) => setColor(event.target.value)}
          placeholder={placeholder}
          value={color}
        />
      </div>
    </label>
  );
}
