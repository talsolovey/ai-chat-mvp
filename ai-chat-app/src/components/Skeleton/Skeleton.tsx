import type { CSSProperties, ReactElement } from "react";
import styles from "./Skeleton.module.css";

type SkeletonProps = {
  height?: number | string;
  width?: number | string;
  borderRadius?: number | string;
};

type SkeletonCSSVars = CSSProperties & {
  "--skeleton-height"?: string;
  "--skeleton-width"?: string;
  "--skeleton-radius"?: string;
};

function toCssLength(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

export default function Skeleton({
  height,
  width,
  borderRadius,
}: SkeletonProps): ReactElement {
  const style: SkeletonCSSVars = {};
  if (height !== undefined) {
    style["--skeleton-height"] = toCssLength(height);
  }
  if (width !== undefined) {
    style["--skeleton-width"] = toCssLength(width);
  }
  if (borderRadius !== undefined) {
    style["--skeleton-radius"] = toCssLength(borderRadius);
  }

  return (
    <div
      data-testid="skeleton"
      aria-hidden="true"
      className={styles.skeleton}
      style={style}
    />
  );
}
