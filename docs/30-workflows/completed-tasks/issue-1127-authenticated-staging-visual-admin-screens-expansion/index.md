# issue-1127: authenticated staging visual 基盤の admin 画面横展開

> **ステータス: Phase 1-12 完了（implemented_local_runtime_pending / capture・baseline・PR は user-gated）**
> **[実装区分: 実装仕様書]** — 成果物は新規 Playwright visual spec 5 本（read-only）。

## 概要

issue-1077 で確立した authenticated staging visual 基盤を再利用し、未カバーの 5 admin 画面
（audit / requests / identity-conflicts / schema / meetings）へ read-only 初期表示の visual baseline を横展開する
実装仕様書。プロダクトコード（apps/web/src・apps/api）・D1・playwright.config.ts・CI は不変。

| 項目 | 値 |
| --- | --- |
| issue | #1127（CLOSED 維持 / refs-only）|
| 親 workflow | issue-1077-bulk-tag-authenticated-staging-visual |
| 消費 unassigned-task | `docs/30-workflows/unassigned-task/task-issue-1077-followup-002-authenticated-staging-visual-admin-screens-expansion.md` |
| 実装区分 | 実装仕様書（implementation_mode: new）|
| taskClassification | UI / VISUAL_ON_EXECUTION |
| status | implemented_local_runtime_pending |
| branch（予定）| docs/issue-1127-authenticated-staging-visual-admin-screens-expansion-spec / base: dev |

## 調査結論（issue 最適化）

issue #1127 は **部分的にのみ解決済み**:

| route | authenticated visual spec | 状態 |
| --- | --- | --- |
| `/admin`（dashboard）| issue-901 | ✅ 既存 |
| `/admin/tags` | admin-tag-queue-ui-and-404-recovery/task-C | ✅ 既存（スコープ除外）|
| `/admin/members`（bulk-tag）| issue-1077 | ✅ 既存 |
| `/admin/audit` | — | ❌ **本タスクで追加** |
| `/admin/requests` | — | ❌ **本タスクで追加** |
| `/admin/identity-conflicts` | — | ❌ **本タスクで追加** |
| `/admin/schema` | — | ❌ **本タスクで追加** |
| `/admin/meetings` | — | ❌ **本タスクで追加** |

→ 未カバー 5 画面への横展開が依然必要。`/admin/tags` 等の既実装はスコープから除外（最適化）。

## 成果物（新規 spec 5 本）

| spec file | route | screenshot |
| --- | --- | --- |
| `admin-audit-authenticated.spec.ts` | `/admin/audit` | `admin-audit-authenticated.png` |
| `admin-requests-authenticated.spec.ts` | `/admin/requests` | `admin-requests-authenticated.png` |
| `admin-identity-conflicts-authenticated.spec.ts` | `/admin/identity-conflicts` | `admin-identity-conflicts-authenticated.png` |
| `admin-schema-authenticated.spec.ts` | `/admin/schema` | `admin-schema-authenticated.png` |
| `admin-meetings-authenticated.spec.ts` | `/admin/meetings` | `admin-meetings-authenticated.png` |

配置先: `apps/web/playwright/tests/visual-staging-authenticated/`（testDir + path glob で自動認識）

## Phase 一覧

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 要件定義 | [phase-1.md](phase-1.md) | 完了 |
| 2 設計 | [phase-2.md](phase-2.md) | 完了 |
| 3 設計レビュー（Gate-A）| [phase-3.md](phase-3.md) | 完了（PASS）|
| 4 テスト作成 | [phase-4.md](phase-4.md) | 完了 |
| 5 実装（spec 正本）| [phase-5.md](phase-5.md) | 完了（コード確定 / runtime capture user-gated）|
| 6 テスト拡充 | [phase-6.md](phase-6.md) | 完了 |
| 7 カバレッジ | [phase-7.md](phase-7.md) | 完了 |
| 8 リファクタリング | [phase-8.md](phase-8.md) | 完了 |
| 9 品質保証 | [phase-9.md](phase-9.md) | 完了 |
| 10 最終レビュー | [phase-10.md](phase-10.md) | 完了 |
| 11 手動テスト/視覚検証 | [phase-11.md](phase-11.md) | 完了（実 capture user-gated）|
| 12 ドキュメント更新 | [phase-12.md](phase-12.md) / [outputs/phase-12/main.md](outputs/phase-12/main.md) | 完了 |
| 13 PR 作成 | [phase-13.md](phase-13.md) | blocked_pending_user_approval |

## 不変条件・境界

- read-only 初期表示のみ capture。mutation トリガー（承認/却下/merge/別人マーク/割当/Bulk Resolve/Rollback/再集計/開催日 CRUD/出席 CRUD）を**一切クリックしない** → staging D1 副作用ゼロ。
- mutation result 状態の baseline は C-1 系（issue-1125 系列）へ委譲する恒久境界（先送りではない）。
- local 実装は完了。staging capture / baseline 生成 / commit / push / PR は user-gated（CONST_002）。
- issue #1127 は CLOSED 維持（reopen しない）。
