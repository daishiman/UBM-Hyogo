# Phase 10: 最終レビュー — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 10 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。

## 目的

GO/NO-GO を判定し、blocker 一覧を確定する。

## 実行タスク

1. 上流 wave（06c admin shell / 06b-A session resolver）の AC が満たされているか確認する。完了条件: 未充足なら NO-GO。
2. blocker 一覧（未確定 schema、未確定 endpoint、未確定 audit log policy 等）を出す。完了条件: 全 blocker に owner と期日案が付く。
3. GO 判定の前提条件（user approval gate / staging deploy 順序）を明文化する。完了条件: Phase 13 の前提が固まる。

## 参照資料

- outputs/phase-01/main.md 〜 outputs/phase-09/main.md
- 06b-A-me-api-authjs-session-resolver/index.md

## 実行手順

- 対象 directory: docs/30-workflows/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- 上流 NO-GO 状況を見落とさない。

## サブタスク管理

- [ ] 上流 AC を確認する
- [ ] blocker 一覧を出す
- [ ] GO/NO-GO を記録する
- [ ] outputs/phase-10/main.md を作成する

## 実装仕様 (CONST_005)

### 最終レビュー観点

| # | 観点 | 確認方法 | 合否 |
| --- | --- | --- | --- |
| 1 | admin-managed data 分離 | `meeting_sessions` / `member_attendance` が Form schema 由来でないことを code review | ✓ / ✗ |
| 2 | apps/web の D1 直接アクセス禁止 | `grep -rn "D1Database\\|env.DB\\|DB.prepare" apps/web/` で hits 0、apps/api 経由 cookie forwarding のみ | ✓ / ✗ |
| 3 | audit log 全 mutation カバレッジ | `meeting.created` / `meeting.updated` / `meeting.deleted`（論理削除）/ `attendance.added` / `attendance.removed` の 5 actions すべてに `writeAudit` が呼ばれる | ✓ / ✗ |
| 4 | requireAdmin 二段防御 | apps/api 側 `requireAdmin` middleware と apps/web 側 `middleware.ts` の matcher 両方で `/admin/*` をガード | ✓ / ✗ |
| 5 | 削除済み member の attendance 候補除外 | `members.deleted_at IS NOT NULL` を attendance 候補 SELECT で除外、test で assertion | ✓ / ✗ |
| 6 | エラーハンドリング網羅 | 401（未ログイン）/ 403（admin 以外）/ 404（meeting 不在）/ 422（zod 違反）が API test で網羅されている | ✓ / ✗ |
| 7 | 上流 wave AC 充足 | 06c admin shell / 06b-A session resolver の AC が満たされている | ✓ / ✗ |
| 8 | 論理削除の不可視化 | 論理削除 (`deleted_at`) が GET list / export.csv / attendance mutation で除外されている（GET detail endpoint は 06c-E では未提供） | ✓ / ✗ |
| 9 | CSV 仕様 | BOM 付与 / 改行 `\r\n` / `Content-Disposition: attachment; filename="..."` / 列順固定 | ✓ / ✗ |
| 10 | secret 混入リスク | PR diff / evidence にメール・実名・cookie 値が混入していない | ✓ / ✗ |

### blocker 一覧フォーマット

各 blocker に owner / 期日案 / GO 条件 を付与する。GO 判定の前提条件（user approval gate / staging deploy 順序）も明文化する。

### evidence path

- `outputs/phase-10/review-checklist.md`（10 観点の結果）
- `outputs/phase-10/blockers.md`（blocker 一覧 + owner + 期日）
- `outputs/phase-10/go-no-go-decision.md`

### DoD（CONST_005）

- 全 10 観点が ✓ で記録されている（blocker ゼロ）
- blocker が残る場合は owner / 期日 / GO 条件が確定している
- GO/NO-GO 判定が記録され、Phase 13 の前提が固まっている

## 成果物

- outputs/phase-10/main.md
- outputs/phase-10/review-checklist.md
- outputs/phase-10/blockers.md
- outputs/phase-10/go-no-go-decision.md

## 完了条件（CONST_005 強化版）

- [x] GO/NO-GO 判定が記録される
- [x] blocker と owner / 期日が確定する
- [x] 10 レビュー観点すべてが ✓（または ✗ 時は blocker 化）
- [x] evidence path（上記 3 ファイル）が揃っている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ、GO 判定と blocker 一覧を渡す。
