"use client";

import { useEffect, useState } from "react";

type LocalDateTimeProps = {
  fallback?: string;
  value: string | null | undefined;
};

export function LocalDateTime({ fallback = "-", value }: LocalDateTimeProps) {
  const [formattedValue, setFormattedValue] = useState(fallback);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      if (!value) {
        setFormattedValue("-");
        return;
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        setFormattedValue(fallback);
        return;
      }

      setFormattedValue(
        new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date),
      );
    });

    return () => cancelAnimationFrame(frameId);
  }, [fallback, value]);

  return <span suppressHydrationWarning>{formattedValue}</span>;
}
