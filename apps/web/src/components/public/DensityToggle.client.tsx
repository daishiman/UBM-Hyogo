"use client";

// task-11: density radiogroup。URL の `density` を直接書き換える。
// 不変条件 #8 (URL query 正本): client state は持たない。

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const DENSITY_OPTIONS: ReadonlyArray<{
  value: "comfy" | "dense" | "list";
  label: string;
}> = [
  { value: "comfy", label: "ゆったり" },
  { value: "dense", label: "詰め込み" },
  { value: "list", label: "リスト" },
];

export interface DensityToggleProps {
  value: "comfy" | "dense" | "list";
}

export function DensityToggle({ value }: DensityToggleProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const onChange = useCallback(
    (next: DensityToggleProps["value"]) => {
      const params = new URLSearchParams(sp ? sp.toString() : "");
      if (next === "comfy") {
        params.delete("density");
      } else {
        params.set("density", next);
      }
      const qs = params.toString();
      router.replace(qs ? `/members?${qs}` : "/members");
    },
    [router, sp],
  );

  return (
    <div
      role="radiogroup"
      aria-label="表示密度"
      data-component="density-toggle"
    >
      {DENSITY_OPTIONS.map((opt) => (
        <label key={opt.value}>
          <input
            type="radio"
            name="density"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
