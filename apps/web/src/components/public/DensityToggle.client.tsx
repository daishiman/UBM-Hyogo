"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useId, useRef } from "react";

import { useDismissable, type DismissReason } from "../../hooks/useDismissable";
import { Icon } from "../ui/Icon";
import { Segmented } from "../ui/Segmented";

type Density = "comfy" | "dense" | "list";

const OPTIONS: ReadonlyArray<{
  value: Density;
  label: string;
  sublabel: string;
  description: string;
}> = [
  {
    value: "comfy",
    label: "ゆったり",
    sublabel: "紹介文とタグまで確認",
    description: "カードに自己紹介、関心タグ、詳細への導線を広く表示します。",
  },
  {
    value: "dense",
    label: "密",
    sublabel: "多くの候補を一度に比較",
    description: "余白を抑えて、複数のメンバーを素早く見比べます。",
  },
  {
    value: "list",
    label: "リスト",
    sublabel: "名前と区画を行で走査",
    description: "一覧表に近い表示で、名前、区画、肩書きを順に確認します。",
  },
];

export interface DensityToggleProps {
  value: Density;
}

export function DensityToggle({ value }: DensityToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const uid = useId();
  const descId = (v: Density) => `${uid}-density-${v}-desc`;

  const detailsRef = useRef<HTMLDetailsElement>(null);

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

  // <details> は非制御のまま native 標準挙動（summary toggle）を維持し、
  // close 操作だけを ref 経由で命令的に行う。
  const onDismiss = useCallback((reason: DismissReason) => {
    const details = detailsRef.current;
    if (!details?.open) return;
    details.open = false;
    if (reason === "escape") {
      details.querySelector("summary")?.focus();
    }
  }, []);

  useDismissable(detailsRef, onDismiss);

  const segmentedOptions = OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    sublabel: option.sublabel,
    describedBy: descId(option.value),
  }));

  return (
    <div data-component="density-toggle-control">
      <Segmented
        ariaLabel="表示密度"
        data-component="density-toggle"
        value={value}
        options={segmentedOptions}
        onChange={onChange}
      />
      {OPTIONS.map((option) => (
        <span key={option.value} id={descId(option.value)} className="visually-hidden">
          {option.description}
        </span>
      ))}
      <details ref={detailsRef} data-component="help-hint">
        <summary aria-label="表示密度の説明を見る">
          <Icon name="help" size="sm" />
        </summary>
        <dl>
          {OPTIONS.map((option) => (
            <div key={option.value}>
              <dt>{option.label}</dt>
              <dd>{option.description}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
