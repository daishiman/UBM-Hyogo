"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef } from "react";

import { browserDocument } from "../../lib/is-browser";
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
  const closeHelp = useCallback(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, []);

  // Escape / click-outside による close。listener は mount〜unmount で張り、
  // ハンドラ内で detailsRef.current.open を直接判定する（open のときだけ作用）。
  // unmount で必ず解除して event listener leak を防ぐ。
  useEffect(() => {
    const doc = browserDocument();
    if (!doc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && detailsRef.current?.open) {
        closeHelp();
        detailsRef.current?.querySelector("summary")?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (
        detailsRef.current?.open &&
        target instanceof Node &&
        !detailsRef.current.contains(target)
      ) {
        closeHelp();
      }
    };
    doc.addEventListener("keydown", onKeyDown);
    doc.addEventListener("pointerdown", onPointerDown);
    return () => {
      doc.removeEventListener("keydown", onKeyDown);
      doc.removeEventListener("pointerdown", onPointerDown);
    };
  }, [closeHelp]);

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
