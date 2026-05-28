# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## 不変条件 trace

| 不変条件 | 設計上の遵守 |
|---------|------------|
| #1 既存 API surface のみ | Lane A は `GET /admin/schema/diff` の修復のみ。Lane B も `/admin/schema/diff` + 既存 `/admin/schema/history` のみを呼ぶ |
| #2 OKLch tokens 正本 | Lane B / C で HEX 直書きを残さない。`tokens.css` 既存 token を使う |
| #3 プロトタイプ primitives 正本 | `pages-admin.jsx` `SchemaDiffPage` 構造を踏襲。新 primitive 0、既存 `_shared` の AdminSectionCard / AdminStat を再利用 |
| #4 D1 直接アクセス禁止 | `safeServerFetch` 経由のみ |

## リスク

| Risk | 影響 | 緩和 |
|------|-----|------|
| R1: `/admin/schema/diff` レスポンスに `revisions[]` / `aliases[]` が含まれない | Lane B の grid-2 が空 | 並列で `/admin/schema/history` を呼ぶ fallback を Phase 5 で実装 |
| R2: SchemaDiffPanel の既存スナップショット spec が hideInlineStats 追加で破損 | spec fail | Phase 6 で既存 spec の default 経路（hideInlineStats=false）を追記し後方互換確認 |
| R3: Lane A 切り分けで原因が staging deploy 同期不全だった場合、再現 spec を unit 層に書けない | regression spec が空回り | unit lane の contract spec で「200 + 必須 fields」を固定し、deploy 同期不全自体は CI deploy job 側で検知 |
| R4: visual baseline の生成は CI 環境（Linux）が必要 | local では Darwin baseline ができる | `playwright.config` の `admin-staging-visual` project + `EVIDENCE_DIR` 自動分岐で対応（既存運用に合流） |
| R5: AdminSidebar label 変更で他テストや E2E が壊れる | spec fail | Phase 6 で `AdminSidebar.component.spec.tsx` も同 PR で修正 |

## 代替案検討

| 代替 | 採用 | 理由 |
|------|------|------|
| Lane B の page-head / stats を新 `_shared/AdminPageHead` として export | 不採用 | 他 admin page と同一構造になるまで未確認。新 primitive 抑止 |
| `GET /admin/schema/diff` のレスポンスに `revisions` を含めるよう API 改修 | 不採用 | 既存 surface 変更禁止（不変条件 #1） |
| stats を SchemaDiffPanel から page.tsx に完全移管 | 不採用 | 既存 caller の挙動破壊。`hideInlineStats` prop で切替に留める |

## 同期する skill / ドキュメント

| 対象 | 内容 |
|------|------|
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本 workflow 1 行追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-admin-schema-page-prototype-alignment-and-diff-fetch-fix-artifact-inventory.md` | 新規 artifact inventory |
| `.claude/skills/aiworkflow-requirements/changelog/20260527-admin-schema-page-prototype-alignment-and-diff-fetch-fix.md` | 新規 changelog |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | `/admin/schema` 節を本実装に整合（page-head + stats + revisions + alias history を追記） |

## ゲート

- Gate-A (spec_review): 本 Phase 3 + outputs/phase-12 strict 7 が揃った時点で passed 候補
- Gate-B (implementation_review): Phase 5 実装 + Phase 6/7/8/9 通過 + Phase 11 authenticated screenshot 取得後
- Gate-C (external_ops): commit / push / PR — user-gated
