# Phase 10: レビュー + 整合確認（実装と `_design/` の対応 1:1）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 10 / 13 |
| Phase 名称 | レビュー + 整合確認 |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 9 (indexes 再生成 + 検証) |
| 状態 | verified |
| 次 Phase | 11 (NON_VISUAL evidence 収集) |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

実装した `_shared/sync-jobs-schema.ts` と markdown 論理正本 `_design/sync-jobs-spec.md` の対応を 1:1 で確認し、AC 11 件すべてが PASS していること、INV-1〜INV-6 が破られていないことをレビューチェックリストで担保する。

## 実行タスク

1. AC-1〜AC-11 の最終チェック表更新
2. INV-1〜INV-6 の遵守確認
3. `_design/` 文面と TS 実装値の一致確認（lock TTL / job_type 値 / 共通 schema フィールド名）
4. 既存 import 経路の影響範囲レビュー
5. open question 3 件の resolution 記録

## レビューチェックリスト

| AC | 確認項目 | 状態 |
| --- | --- | --- |
| AC-1 | `_shared/sync-jobs-schema.ts` の export が Phase 2 契約と完全一致 | ☐ |
| AC-2 | vitest 10 件すべて PASS | ☐ |
| AC-3 | `DEFAULT_LOCK_TTL_MS` が `apps/api/src/jobs/sync-forms-responses.ts` で 0 件 | ☐ |
| AC-4 | `repository/syncJobs.ts` が re-export | ☐ |
| AC-5 | `cursor-store.ts` が `parseMetricsJson` 経由 | ☐ |
| AC-6 | 既存テスト 3 件全 PASS | ☐ |
| AC-7 | `_design/sync-jobs-spec.md` の TS 正本リンクが §3 / §5 / lock 章に記載 | ☐ |
| AC-8 | `database-schema.md` が `_design/` + TS 正本参照に統一 | ☐ |
| AC-9 | indexes drift 0 件 | ☐ |
| AC-10 | typecheck / lint PASS | ☐ |
| AC-11 | `assertNoPii` テスト 3 件 PASS + `unassigned-task-detection.md` 記録 | ☐ |

## 整合性 1:1 確認

| 項目 | markdown 論理正本（`_design/`） | TS 実装正本（`_shared/sync-jobs-schema.ts`） | 一致 |
| --- | --- | --- | --- |
| job_type 値 | `response_sync` / `schema_sync`（or `response_sync` / `schema_sync` 実装値） | `["schema_sync", "response_sync"]` | ☐ |
| lock TTL | 10 分 | `SYNC_LOCK_TTL_MS = 600_000` | ☐ |
| metrics 共通フィールド | cursor / processed_count / write_count / error_count / lock_acquired_at | 同（passthrough） | ☐ |
| PII 不混入 | INV-1 明文化 | `assertNoPii` 実装 | ☐ |

> 注: `_design/` の job_type 値（`forms_*` 表記）と実装値（`*_sync` 表記）に差がある場合、実装値を正とし `_design/` を実装値に揃える（実装は既存挙動維持のため変更不可）。整合差分は本 Phase で `_design/` 側を更新する。

## INV 遵守確認

| INV | 確認 | 状態 |
| --- | --- | --- |
| INV-1 PII 不混入 | `assertNoPii` テスト 3 件 PASS | ☐ |
| INV-2 DDL 非変更 | migrations 新規 0 件 | ☐ |
| INV-3 migration 追加なし | `apps/api/migrations/` git diff 0 件 | ☐ |
| INV-4 lock TTL 10 分固定 | `SYNC_LOCK_TTL_MS = 600_000` | ☐ |
| INV-5 既存テスト破壊禁止 | 全 PASS | ☐ |
| INV-6 SyncJobKind 値後方互換 | `schema_sync` / `response_sync` | ☐ |

## open question resolution

- Q1（assertNoPii 書き込み経路適用）: `syncJobs.succeed()` で今回サイクル内に完了、`unassigned-task-detection.md` は未タスク 0 件として記録
- Q2（zod 依存）: Phase 3 で確認、追加した場合 `pnpm-lock.yaml` を本 PR に含める
- Q3（SyncJobKind 互換）: re-export で互換維持完了

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | レビューチェックリスト / 整合性 1:1 表 / INV 遵守 |
| メタ | artifacts.json | Phase 10 を completed に更新 |

## 統合テスト連携

- レビューフェーズのため新規実行はなし
- 不整合があれば前 Phase に巻き戻す

## 完了条件

- [ ] AC-1〜AC-11 全項目 PASS チェック
- [ ] 整合性 1:1 表が全行一致
- [ ] INV-1〜INV-6 全項目 PASS
- [ ] open question 3 件の resolution 記録

## 次 Phase

- 次: 11（NON_VISUAL evidence 収集）
- 引き継ぎ事項: レビュー結果一式
- ブロック条件: AC / INV のいずれかが fail
