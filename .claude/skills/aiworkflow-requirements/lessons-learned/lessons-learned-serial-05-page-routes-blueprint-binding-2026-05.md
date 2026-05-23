# Lessons learned — serial-05 page routes blueprint binding (2026-05-22)

> 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/`
> sub-workflow: `serial-05-page-routes-blueprint-binding/`
> 関連 SSOT: [phase12-strict-7-workflow-root-parity-gate.md](../../task-specification-creator/references/phase12-strict-7-workflow-root-parity-gate.md), [patterns-parallel-sub-workflow.md](../../task-specification-creator/references/patterns-parallel-sub-workflow.md)

---

## L-S05-001: sub-workflow `outputs/phase-12/` は parent root に集約し、sub 側に複製しない

- **事象**: serial-05 で `outputs/phase-12/implementation-guide.md` を sub 配下に作りかけ、parent root（`docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/`）と二重存在する状態になった。
- **原因**: parallel-01〜04 close-out の時に確立した「parent root 集約 SSOT」を skill SSOT に明文化したものの、serial-05 仕様書ドラフト段階では「sub 配下にも strict 7 を置く」という旧パターンの残骸が残っていた。
- **対策**: serial-05 sub の `outputs/phase-12/` を物理削除し、sub に許容される Phase 12 doc は `phase-12-compliance-check.md`（canonical 9 headings 確認用）のみとする L-PARA04-003 をワークフロー横断に展開。`task-specification-creator/references/phase12-strict-7-workflow-root-parity-gate.md` Step 4 の grep gate で再発を fail 判定。
- **carry-forward**: `serial-06-form-response-binding` / `serial-07-regression-evidence` も同 parity を踏襲する。spec 起票時に sub 配下に `outputs/phase-12/` を作らず、最初から parent root に集約する。

## L-S05-002: 空 phase ディレクトリ（`outputs/phase-1`〜`phase-10`）は spec 起票時点で作らない

- **事象**: serial-05 sub に `outputs/phase-1` 〜 `phase-10` の空ディレクトリが残り、git untracked 表示と physical evidence の inventory 検証が紛らわしくなった。
- **原因**: phase ごとに `mkdir -p outputs/phase-N` を予防的に作っていた。
- **対策**: phase 11 / phase 12 など物理 evidence を実際に生成する phase のみディレクトリを作る。spec 起票 stage では outputs/ 自体を作らない。
- **carry-forward**: workflow 起票テンプレを「物理出力が確定する phase でのみ mkdir」へ更新する（task-specification-creator の起票チェックリストへ反映済）。

## L-S05-003: 19 routes blueprint binding は差分最小 + data-* 契約 + parent 集約 evidence で完結する

- **事象**: 19 routes 全 page.tsx + 3 layout に対し「冒頭コメント `// serial-05: <route> — blueprint 09X:LLL-MMM`」「`<main data-route>` `data-section-rhythm` 属性」「layout `<main data-section-rhythm>`」の 3 種だけを追加する差分最小実装で grep gate G-1〜G-8 を全 PASS にできた。新 primitive / API endpoint / D1 schema 変更ゼロ。
- **対策**: 新規 primitive を生やさず、既存 primitive 群（parallel-01〜04 が用意した data-* 契約）の上に route marker と rhythm 属性だけ載せる「serial 系の差分最小規約」を成立させた。
- **carry-forward**: serial-06 (form response binding) / serial-07 (regression evidence) も同じ「既存 primitive + data-* 契約 + grep gate」方式で実装する。primitive 増殖を避ける。

## L-S05-004: build 時の env schema 依存は Phase 10 で local build command を明記する

- **事象**: `apps/web` の production build (`next build --webpack`) は `ENVIRONMENT` / `NEXT_PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` / `AUTH_URL` / `AUTH_SECRET` / `SENTRY_*` の zod schema を要求する。Phase 10 の verification command にこれを書かないと local build が落ちる。
- **対策**: Phase 12 implementation-guide の `## Verification Commands` に `ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=... mise exec -- pnpm --filter @ubm-hyogo/web build` の form で full command を記載。
- **carry-forward**: `apps/web` を build する全 sub-workflow の Phase 10 / Phase 12 verification command に同 env block を含める（task-specification-creator skill-feedback-report で promotion 済）。

## 関連リンク

- skill artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-ui-prototype-design-system-foundation-artifact-inventory.md` § Sub-workflow: serial-05 Page Routes Blueprint Binding
- 親 skill feedback: `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/skill-feedback-report.md`
- parent root strict 7: `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/`
- parity gate SSOT: [[phase12-strict-7-workflow-root-parity-gate]]
