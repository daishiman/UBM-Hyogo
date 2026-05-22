# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## 目的

Definition of Done (D-01〜D-13) 達成と未タスク化候補の確定。

## DoD チェックリスト (元仕様 §10 を踏襲)

- [ ] D-01: `/admin/schema` SSR 200 + diff list + stableKey 割当 + apply Button 機能
- [ ] D-02: `/admin/identity-conflicts` SSR 200 + 候補 list + side-by-side compare + resolve bar 機能
- [ ] D-03: `/admin/audit` SSR 200 + filter (actorEmail/action/targetType/targetId/from/to) + timeline + cursor pager 機能
- [ ] D-04: `/admin/schema/diff`, `/admin/schema/aliases`, `/admin/sync/schema`, `/admin/identity-conflicts` (merge/dismiss 含む), `/admin/audit` を adapter 経由で接続
- [ ] D-05: `verify-design-tokens` green
- [ ] D-06: jest-axe critical violations 0
- [ ] D-07: vitest テスト (Phase 4-6 の 11 ファイル) green
- [ ] D-08: AdminSidebar の active 表示が 3 route で当たる (task-15 layout 任せだが local 確認)
- [ ] D-09: 派生ルール (schema: Diff+Apply / conflicts: Side-by-side / audit: FilterBar+Timeline) が phase-3 §3.1 と整合
- [ ] D-10: `apps/api` 側変更 0 行
- [ ] D-11: `pnpm typecheck` / `pnpm lint` green
- [ ] D-12: 担当 3 画面が auth gate 越え → 200 を Playwright で確認 (Phase 11 でも再確認)
- [ ] D-13: 8 admin 画面 (task-15/16/17 合計) で OKLch 適用 / a11y critical 0 / AdminSidebar active / API 接続が確認できる

## 判定区分

- **MAJOR**: D-XX 未達 → Phase 5/6/8 へ差し戻し
- **MINOR**: 軽微な改善余地 → 未タスク化候補として `outputs/phase-10/minor-findings.md` に列挙

## MINOR 指摘 → 未タスク化ルール (重要)

Phase 10 で MINOR 判定したものは **必ず Phase 12 Task 4 で `unassigned-task-detection.md` に formalize** する。「機能に影響なし」は不要判定の理由にならない (skill ルール)。

## 検査観点

- 仕様書 (元 task-17) 記載の API endpoint と実 fetch path の差異
- `/admin/schema/aliases` 不在環境での disabled + tooltip フォールバックが UI で確認可能
- audit FilterBar から `?actor=...` を差し込むと該当 actor のみ filter される
- task-15 dashboard "Recent Actions" → `/admin/audit?actor=...` 遷移の searchParams 反映

## 成果物

- `outputs/phase-10/final-review-result.md` — D-01〜D-13 判定 + MINOR list

## DoD

- [ ] 全 D 項目が PASS / MINOR / MAJOR で分類
- [ ] MAJOR 0 件
- [ ] MINOR は Phase 12 で formalize 予定としてマーク
