---
task_root: docs/30-workflows/completed-tasks/members-page-prototype-alignment/
synced_at: 2026-05-23
state: implemented_local_evidence_captured / implementation / VISUAL
related_specs:
  - docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx
  - docs/00-getting-started-manual/claude-design-prototype/styles.css
  - docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md
---

# members-page-prototype-alignment の苦戦箇所と知見

## L-MPA-001: visual workflow は strict 7 を早期に物理配置する

Phase 12 compliance gate は workflow root の構造を検証する。実装前後を問わず `outputs/phase-12/` の strict 7 と `outputs/artifacts.json` mirror を置き、実装 evidence と仕様構造を混同しない。

## L-MPA-002: present evidence は物理ファイルで裏付ける

Phase 11 screenshot rows を `present` に昇格するのは、物理 PNG / log が workflow root 配下に存在し、path traversal や絶対 path を含まない場合だけに限定する。今回の EV-1..EV-6 は local Playwright で保存済み。

## L-MPA-003: prototype CSS 対応表は workflow inventory で足りる場合がある

単一 workflow で必要な prototype JSX / CSS / target component 対応は artifact inventory に閉じ込める。複数 workflow で同じ lookup が繰り返されるまでは、新しい正本 index や未タスクを増やさないほうが複雑性が低い。

## L-MPA-004: Next.js metadata route の token gate 例外は nested route も含める

`next/og ImageResponse` は CSS variable を解決しないため、既存 verifier は top-level `opengraph-image.tsx` / `twitter-image.tsx` 等を HEX literal scan から除外していた。App Router の nested metadata route は `opengraph-image/route.tsx` になるため、同じ例外に含めないと token gate が false positive になる。
