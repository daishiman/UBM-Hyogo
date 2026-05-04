# Phase 9: 品質保証 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 9 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。

## 目的

型安全 / lint / test / a11y / 無料枠 / secret hygiene を確認する。

## 実行タスク

1. 型安全（`mise exec -- pnpm typecheck`）/ lint / test の通過条件を列挙する。完了条件: コマンドが記録される。
2. 無料枠見積もり（D1 row 数: meetings 〜数百行 / attendances 〜数千行 / 月次 read 数）を出す。完了条件: 数値根拠が出る。
3. secret hygiene（新規 secret 無し、AUTH_SECRET 流用、`.env` 平文禁止）を確認する。完了条件: チェックリストが埋まる。
4. a11y（Drawer focus trap / Form label / CSV download button の aria）を確認する。完了条件: WCAG AA 観点が記録される。

## 参照資料

- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- CLAUDE.md（シークレット管理セクション）

## 実行手順

- 対象 directory: docs/30-workflows/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。
- secret 値そのものは記載しない。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- 無料枠超過リスク（D1 row 数 / 月次 R/W）。

## サブタスク管理

- [ ] 型 / lint / test 通過条件を書く
- [ ] 無料枠見積もりを書く
- [ ] secret hygiene を確認する
- [ ] a11y を確認する
- [ ] outputs/phase-09/main.md を作成する

## 実装仕様 (CONST_005)

### 品質保証チェックリスト

| # | 項目 | コマンド / 手順 | 合格基準 |
| --- | --- | --- | --- |
| 1 | typecheck | `mise exec -- pnpm typecheck` | exit 0、エラー 0 件 |
| 2 | lint | `mise exec -- pnpm lint` | exit 0、warning も 0 件（CI gate と整合） |
| 3 | api unit / integration test | `mise exec -- pnpm test --filter @ubm-hyogo/api` | meetings.test.ts / attendance.test.ts 緑 |
| 4 | web unit test | `mise exec -- pnpm test --filter @ubm-hyogo/web` | MeetingPanel / Drawer のテスト緑 |
| 5 | build | `mise exec -- pnpm build` | apps/api / apps/web 双方成功 |
| 6 | coverage gate | `apps/api` の `meetings.test.ts` / `attendance.test.ts` カバレッジ閾値遵守（`scripts/coverage-guard.sh --changed`） | 閾値 pass |
| 7 | a11y（手動） | MeetingPanel の Drawer 開閉、Form ラベル、Tab 順、Esc で閉じる、focus trap、CSV download button の `aria-label` を実機確認 | WCAG AA 観点 OK |
| 8 | 不変条件 #4 | admin-managed data（meeting_sessions / member_attendance）が Form schema 経由で更新されないことを code review | ✓ |
| 9 | 不変条件 #5 | `apps/web` から D1 直接アクセスが無いことを `grep -rn "D1Database\\|env.DB" apps/web/` で確認 | hits 0 |
| 10 | 不変条件 #7 | MVP では Google Form 再回答が本人更新の正本である前提を壊さない（meetings は admin 専用） | ✓ |
| 11 | 不変条件 #13 | audit log が 5 mutation（created/updated/deleted/attendance.added/attendance.removed）すべてに付与されていることを test で assertion | ✓ |
| 12 | 不変条件 #15 | requireAdmin が API 側 + apps/web middleware の二段で適用されているか確認 | ✓ |
| 13 | 無料枠見積もり | D1 row 数: meeting_sessions 〜数百行 / member_attendance 〜数千行 / 月次 read 数を試算 | Workers Free / D1 Free 範囲内 |
| 14 | secret hygiene | 新規 secret 無し、AUTH_SECRET 流用、`.env` 平文禁止を確認 | ✓ |

### 検証コマンド一括

```bash
mise exec -- pnpm typecheck \
  && mise exec -- pnpm lint \
  && mise exec -- pnpm test --filter @ubm-hyogo/api \
  && mise exec -- pnpm test --filter @ubm-hyogo/web \
  && mise exec -- pnpm build
```

### evidence path

- `outputs/phase-09/quality-checklist.md`（チェックリスト 14 項目の結果）
- `outputs/phase-09/test-coverage.txt`（coverage レポート抜粋）
- `outputs/phase-09/a11y-manual-log.md`（a11y 手動確認ログ）

### DoD（CONST_005）

- 全 14 項目が ✓ で記録されている
- 上記コマンドのログが evidence path に保存されている
- coverage gate が pass している
- a11y 手動確認が完了している

## 成果物

- outputs/phase-09/main.md
- outputs/phase-09/quality-checklist.md
- outputs/phase-09/test-coverage.txt
- outputs/phase-09/a11y-manual-log.md

## 完了条件（CONST_005 強化版）

- [x] 型安全 / lint / test の green 条件が固定され、実コマンドが緑になっている
- [x] 無料枠が超過しないことが定量的に示される
- [x] 新規 secret が導入されないことが確認される
- [x] coverage gate が pass し、a11y 手動確認が完了している
- [x] evidence path（上記 4 ファイル）が揃っている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ、品質チェックリストを渡す。
