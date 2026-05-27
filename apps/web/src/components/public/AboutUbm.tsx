// public-dashboard-prototype-alignment: About + Three Zones row-list (2-card grid)
// プロトタイプ pages-public.jsx LandingPage L4-152 整合。pure server component。

import type { ReactNode } from "react";

export interface AboutUbmProps {
  /** About カードのコピーを差し替える場合に使う (デフォルトは prototype 文言) */
  aboutCopy?: ReactNode;
  /** Three Zones の表示を制御 (デフォルト true) */
  showZones?: boolean;
}

const DEFAULT_ABOUT_COPY: ReactNode = (
  <>
    <p data-role="copy">
      UBM（Unlimited Business Members）は、事業フェーズに応じた3つの区画——
      <b>0→1</b>（立ち上げ）・<b>1→10</b>（拡大）・<b>10→100</b>（組織化）——
      に分かれて、メンバー同士が学び合うコミュニティです。
    </p>
    <p data-role="copy">
      兵庫支部会は、地域に根ざした事業者が月一で集まる場。
      本サイトでは、その「どんな人がいるのか」を可視化しています。
    </p>
  </>
);

const ZONES: ReadonlyArray<{
  zone: "0_to_1" | "1_to_10" | "10_to_100";
  chip: string;
  label: string;
  desc: string;
}> = [
  { zone: "0_to_1", chip: "0→1", label: "立ち上げフェーズ", desc: "着想と初期検証" },
  { zone: "1_to_10", chip: "1→10", label: "拡大フェーズ", desc: "仕組み化と再現性" },
  {
    zone: "10_to_100",
    chip: "10→100",
    label: "組織化フェーズ",
    desc: "組織と事業の複線化",
  },
];

export function AboutUbm({
  aboutCopy = DEFAULT_ABOUT_COPY,
  showZones = true,
}: AboutUbmProps = {}) {
  return (
    <section data-component="about-ubm" data-role="grid-2">
      <article data-role="about-card">
        <p data-role="eyebrow">ABOUT</p>
        <h2 data-role="section-heading">事業支援コミュニティ「UBM」</h2>
        {aboutCopy}
      </article>
      {showZones ? (
        <article data-role="zones-card">
          <p data-role="eyebrow">THREE ZONES</p>
          <h2 data-role="section-heading">UBM区画</h2>
          <ul data-role="zone-rows">
            {ZONES.map((z) => (
              <li key={z.zone} data-zone={z.zone} data-role="zone-row">
                <span data-role="chip">{z.chip}</span>
                <span data-role="label">{z.label}</span>
                <span data-role="desc">{z.desc}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
