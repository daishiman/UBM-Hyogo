// task-11: 0→1 / 1→10 / 10→100 静的 3 カード。Token 経由で zone tone を切り替える。

interface ZoneCard {
  zone: "0_to_1" | "1_to_10" | "10_to_100";
  label: string;
  title: string;
  description: string;
}

const ZONES: ZoneCard[] = [
  {
    zone: "0_to_1",
    label: "0 → 1",
    title: "立ち上げる",
    description:
      "アイデアを形にし、最初の一歩を踏み出すフェーズ。仲間と仮説を磨きあいます。",
  },
  {
    zone: "1_to_10",
    label: "1 → 10",
    title: "広げる",
    description:
      "型を作り、再現性を高めるフェーズ。共有と検証で速度を上げていきます。",
  },
  {
    zone: "10_to_100",
    label: "10 → 100",
    title: "拡張する",
    description:
      "事業をスケールさせるフェーズ。組織と仕組みで持続的成長を目指します。",
  },
];

export function ZoneIntro() {
  return (
    <section data-component="zone-intro" aria-labelledby="zone-intro-heading">
      <h2 id="zone-intro-heading">3 つの成長ゾーン</h2>
      <ul data-role="zone-list">
        {ZONES.map((z) => (
          <li
            key={z.zone}
            data-zone={z.zone}
            style={{
              // OKLch token を CSS variable 経由で参照（HEX 直書き禁止 / AC-8）
              borderColor: `var(--ubm-color-zone-${z.zone === "0_to_1" ? "a" : z.zone === "1_to_10" ? "b" : "c"})`,
            }}
          >
            <span data-role="label">{z.label}</span>
            <h3 data-role="title">{z.title}</h3>
            <p data-role="description">{z.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
