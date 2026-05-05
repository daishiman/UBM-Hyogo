# Phase 1: 要件定義（Why/What/不変条件/4条件評価/AC 再マッピング）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義（Why/What/不変条件/4条件評価/AC 再マッピング） |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | なし |
| 次 Phase | 2 (設計 — `_shared/sync-jobs-schema.ts` API + `_design/` schema 設計) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |
| Issue | #198（CLOSED, 2026-05-02 — クローズドのまま実装仕様化） |

## 第 0 セクション: 実装区分の宣言

本タスクは **実装仕様書** である。当初 docs-only として閉じる余地もあったが、`sync_jobs` 正本 drift を防ぐ目的の達成にはランタイム値（`job_type` enum / lock TTL / `metrics_json` schema）の TS 一元化が不可欠で、CONST_004 例外条件に基づき実コード変更を含む。markdown のみでは `DEFAULT_LOCK_TTL_MS` リテラルや `SyncJobKind` のローカル重複を機械検証できない。

## 目的

03b followup #5 起票元の Why / What / 不変条件を本タスクの AC-1〜AC-11 に 1:1 でマッピングし、4 条件評価と open question を確定する。本 Phase は実体ファイル（`_shared/sync-jobs-schema.ts` / 既存編集）を作成しない。要件と境界の固定のみが目的。

## 実行タスク

1. Why の整理（既存リテラル散在による drift / 同期更新漏れリスクの再確認）
2. What の整理（TS 正本 + markdown 論理正本の二層化、4 ファイル変更スコープの確定）
3. 不変条件の列挙（PII 不混入 / DDL 非変更 / migration 追加なし / lock TTL 10 分固定 / 既存テスト破壊禁止）
4. AC-1〜AC-11 の根拠記述（index.md と 1:1 対応 + 担当 Phase 割当）
5. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）
6. open question 列挙（最大 3 件）
7. CONST_004 例外条件の根拠と CONST_007（1 PR 完結）の遵守宣言

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/03b-followup-005-sync-jobs-design-spec/index.md | 本タスク AC 11 件 / Phase 一覧 |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-005-sync-jobs-design-spec.md | 起票元 followup |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | markdown 論理正本（既存） |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | `DEFAULT_LOCK_TTL_MS = 10*60*1000` の根拠 |
| 必須 | apps/api/src/repository/syncJobs.ts | `SyncJobKind` ローカル定義 |
| 必須 | apps/api/src/jobs/cursor-store.ts | `'response_sync'` リテラル / `JSON.parse` 任意キャスト |

## 実行手順（ステップ別）

### ステップ 1: Why の整理

- リテラル散在の現状を `outputs/phase-01/main.md` 冒頭に再掲:
  - `sync-forms-responses.ts:80` の `DEFAULT_LOCK_TTL_MS = 10 * 60 * 1000`
  - `repository/syncJobs.ts:6` の `SyncJobKind` ローカル定義
  - `cursor-store.ts:19` の `WHERE job_type = 'response_sync'` 文字列リテラル + `JSON.parse(...) as { cursor?: string }`
- 「新 sync wave 追加 → 4 ファイル同期更新が必要 → 漏れで enum / TTL / schema 不整合」のリスクパスを明記

### ステップ 2: What の整理

- TS ランタイム正本 `apps/api/src/jobs/_shared/sync-jobs-schema.ts` を新規作成
- markdown 論理正本 `_design/sync-jobs-spec.md` は維持し、TS 正本への参照を追記
- 既存 3 ファイルを共有 module 経由参照に差し替え
- `database-schema.md` の `sync_jobs` 節を `_design/` 参照に統一

### ステップ 3: 不変条件

- INV-1: `metrics_json` に PII を含めない（`assertNoPii` で守る）
- INV-2: DDL は変更しない（既存 schema 準拠）
- INV-3: D1 マイグレーション新規追加なし
- INV-4: lock TTL は 03b 実装値（10 分）を正本、変更時は `_shared/sync-jobs-schema.ts` 起点で同期
- INV-5: 既存テスト（`sync-forms-responses.test.ts` / `sync-sheets-to-d1.test.ts` / `sync-forms-responses.types.test.ts`）を破壊しない
- INV-6: `SyncJobKind` の文字列値は後方互換維持（`schema_sync` / `response_sync`）

### ステップ 4: AC-1〜AC-11 根拠記述

- index.md の AC を `outputs/phase-01/main.md` に転記し、各 AC に下記 4 項目を付ける:
  - 達成根拠 / 検証コマンド / 担当 Phase / 失敗時の分岐

### ステップ 5: 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | TS 正本 + markdown 論理正本の二層化で drift リスクが構造的に解消されるか | PASS |
| 実現性 | 4 ファイル変更 / 13 Phase で 1 営業日内に完遂可能か | PASS |
| 整合性 | AC 11 件 / 不変条件 6 件 / 既存テスト / `verify-indexes-up-to-date` CI gate と矛盾しないか | PASS |
| 運用性 | 後続 sync wave 追加時に `_shared/sync-jobs-schema.ts` を 1 か所更新すれば済むか | PASS |

### ステップ 6: open question 列挙

- Q1: `assertNoPii` を既存の metrics 書き込み call site にも注入するか → 本タスクではスコープ外、`unassigned-task-detection.md` に記録（理由: API 提供までが本タスク責務、注入は別 wave）
- Q2: `zod` が万一 `apps/api/package.json` に未導入だった場合の依存追加方針 → Phase 3 で `pnpm add zod -F @ubm-hyogo/api` を計画化
- Q3: `SyncJobKind` re-export と既存 import 経路の互換性 → Phase 5 棚卸しで全 import を確認

### ステップ 7: CONST 遵守宣言

- CONST_004 例外条件の根拠を本ファイル冒頭で明示
- CONST_007（1 PR / 1 実装サイクル完結）に従い、`assertNoPii` の `syncJobs.succeed()` 書き込み経路適用も今回サイクル内で完了させる

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Why / What / 不変条件 / AC 11 件根拠 / 4 条件 / open question |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 統合テスト連携

- 本タスクは実装仕様書だが、Phase 1 自体は要件定義のみで実装コードは触らない。
- 実装の整合検証は Phase 9 で `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` / `vitest` / `pnpm lint` を実行し、Phase 11 で evidence 化する。

## 完了条件

- [ ] Why / What が起票元 followup と整合
- [ ] 不変条件 INV-1〜INV-6 が列挙されている
- [ ] AC-1〜AC-11 すべてに evidence パス / 検証コマンド / 担当 Phase / 失敗時分岐が紐づく
- [ ] 4 条件評価で MAJOR がない
- [ ] open question が 3 件以内
- [ ] CONST_004 例外根拠と CONST_007 遵守が文中で明示されている
- [ ] `mise exec -- pnpm indexes:rebuild` 実行で drift がない（Phase 9 で再確認）

## 次 Phase

- 次: 2（設計 — `_shared/sync-jobs-schema.ts` API + `_design/` schema 設計）
- 引き継ぎ事項: AC 11 件根拠 / 不変条件 6 件 / open question 3 件 / 実装区分宣言
- ブロック条件: open question 4 件以上 / AC 根拠不足 / 起票元 followup との整合不一致
