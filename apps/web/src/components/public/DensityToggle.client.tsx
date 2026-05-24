"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Segmented } from "../ui/Segmented";

type Density = "comfy" | "dense" | "list";

const OPTIONS: ReadonlyArray<{ value: Density; label: string }> = [
  { value: "comfy", label: "ゆったり" },
  { value: "dense", label: "密" },
  { value: "list", label: "リスト" },
];

export interface DensityToggleProps {
  value: Density;
}

export function DensityToggle({ value }: DensityToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const onChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(sp ? sp.toString() : "");
      if (next === "comfy") {
        params.delete("density");
      } else {
        params.set("density", next);
      }
      const qs = params.toString();
      const base = pathname ?? "/members";
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    },
    [router, pathname, sp],
  );

  return (
    <Segmented
      ariaLabel="表示密度"
      data-component="density-toggle"
      value={value}
      options={[...OPTIONS]}
      onChange={onChange}
    />
  );
}
