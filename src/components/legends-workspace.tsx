import type { CSSProperties, ReactNode } from "react";
import styles from "./legends-workspace.module.css";
export function LegendsWorkspace({
  children,
  colors,
}: {
  children: ReactNode;
  colors?: { brand: string; onBrand: string; ink: string };
}) {
  const style = colors
    ? ({
        "--workspace-brand": colors.brand,
        "--workspace-on-brand": colors.onBrand,
        "--workspace-ink": colors.ink,
      } as CSSProperties)
    : undefined;
  return (
    <div className={styles.workspace} style={style}>
      {children}
    </div>
  );
}
