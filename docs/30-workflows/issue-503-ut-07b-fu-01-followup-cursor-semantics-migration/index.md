# タスク仕様書: Issue #503 — UT-07B-FU-01 schema alias back-fill batch を remaining-scan から cursor 方式に拡張

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-503-ut-07b-fu-01-followup-cursor-semantics-migration |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/503 |
| 起票元 source | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md` |
| 親タスク | `task-ut-07b-fu-01-followup-cursor-semantics-migration` |
| 配置先 | `docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/` |
| 作成日 | 2026-05-07 |
| 状態 | implemented-local / staging runtime evidence pending_user_gate |
| workflow_state | implemented-local |
| runtimeEvidence | local_tests_passed_staging_evidence_pending_user_gate |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装]** — shadow flag による A/B 比較実装、`schemaAliasBackfillBatch.ts` / `schemaDiffQueue.ts` の repository / batch 拡張、test 拡張を local 実装済み。cursor 採用/不採用の最終 runtime 判定は staging evidence user gate 後に行う。 |
| 親 Issue 状態維持 | **OPEN のまま運用**。本仕様書は Issue state を変更しない。`gh issue view #503` 実態は `state: OPEN`。Issue 操作（close/reopen）は本タスク範囲外。 |
| 優先度 | low |
| 規模 | medium |
| 想定 PR 数 | 1（shadow flag + 比較 evidence 取得 → 採用判断 → cursor 採用時の最終実装まで同一サイクル内に含める） |
| coverage AC | `apps/api/src/workflows/schemaAliasBackfillBatch.ts` の cursor 経路 / remaining-scan 経路双方が test PASS（既存 test 不退行 + 新規 cursor 経路 test 追加） |

## GitHub label / tag（Claude Code / Codex 共有用）

このタスクの仕様書を Claude Code / Codex に渡してコード実装 → PR 作成を依頼する際は、必ず以下の label / コンテキストを併送すること。`artifacts.json` の `claudeCodeContext` セクションが正本。

| 用途 | 値 |
| --- | --- |
| Issue 参照 | `#503` (`Refs: #503` を PR 本文に必ず含める) |
| GitHub Issue labels（継承） | `priority:low`, `type:improvement`, `scale:medium`, `status:unassigned`, `area:api` |
| PR に付与する labels | `priority:low`, `type:improvement`, `scale:medium`, `area:api`（`status:unassigned` は PR には付けない） |
| `gh pr create` 引数 | `--label priority:low --label type:improvement --label scale:medium --label area:api` |
| ブランチ名 | `feat/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration` |
| PR タイトル | `feat(api): issue-503 schema alias back-fill cursor semantics shadow flag and decision evidence` |
| 親タスク参照 | `task-ut-07b-fu-01-followup-cursor-semantics-migration` |

> **Claude Code / Codex 実行ガイド**: 仕様書を実行する際は、上記 label / context を Phase 13 の PR 作成プロンプトに必ず引き渡すこと。CLAUDE.md「PR 作成の完全自律フロー」と整合する。

## 目的

UT-07B-FU-01 で実装済みの schema alias back-fill batch（remaining-scan 方式）について、未処理 row が継続的に大きいケースで cursor 方式に拡張すべきかを **runtime evidence ベース**で判定する。判定の結果採用となった場合は、public API `backfill.status` の語彙を変えずに internal 実装のみを cursor 方式に切り替え、不採用の場合は remaining-scan を base case として固定する記録を残す。

具体的には次を達成する:

1. shadow flag (`BACKFILL_CURSOR_MODE`) で remaining-scan / cursor を A/B 切替できる実装を追加
2. staging で 10,000 行以上の fixture を流し、両方式の CPU 時間 / 残行数 / retry_count / `EXPLAIN QUERY PLAN` を evidence として取得
3. 採用判断のしきい値表（Phase 1 で確定）に基づき採用 / 不採用を判定し、不要側を破棄
4. 採用結果を aiworkflow-requirements skill / `phase-12/implementation-guide.md` に反映

## スコープ

### 含む

- shadow flag `BACKFILL_CURSOR_MODE`（値域: `remaining-scan` / `cursor`、default: `remaining-scan`）の追加
- `schemaAliasBackfillBatch.ts` の経路分岐（remaining-scan / cursor）
- `schemaDiffQueue.ts` repository への cursor 取得・更新メソッド追加（採用判断後 or shadow 段階）
- cursor 列 migration `0015_*.sql`（採用時のみ追加 / 不採用時は migration を作らない）
- vitest test の追加（cursor 経路 / remaining-scan 経路双方）
- staging 10,000 行 fixture での比較 evidence 取得
- 採用 / 不採用判断ログを `outputs/phase-12/implementation-guide.md` に記録
- aiworkflow-requirements `references/` / `topic-map` / `keywords` 反映

### 含まない

- public API `backfill.status` の語彙拡張（API contract 不変が制約）
- DLQ / 監視ダッシュボード（別タスク `task-ut-07b-fu-01-followup-dlq-monitoring-dashboard` の責務）
- 50,000 行 extended fixture（別タスク `task-ut-07b-fu-01-followup-extended-fixture-50k` の責務）
- production deploy（採用時も staging evidence までを本タスクの runtime gate とし、production apply は user gate 後の別段ゲート）
- tag 命名規則 / release note 体裁

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `ut-07b-fu-01-schema-alias-backfill-queue-cron-split`（local implementation GO / runtime evidence pending） | remaining-scan の base case を提供する側。runtime PASS 済みとは扱わず、Phase 1 P50 で current state を再確認する |
| 上流 | 既存 migration `0014_schema_diff_queue_dedupe_failure.sql` | cursor 列追加時の整合先 |
| 上流 | staging 10,000 行 fixture（`apps/api/test/fixtures/` 既存） | 比較 evidence の入力 |
| 下流 | aiworkflow-requirements skill (`references/` / `topic-map` / `keywords`) | 採用判断の SSOT 反映先 |
| 下流（独立） | `task-ut-07b-fu-01-followup-dlq-monitoring-dashboard` | 並行タスク（本タスクの cursor 化結果は依存しない） |
| 下流（独立） | `task-ut-07b-fu-01-followup-extended-fixture-50k` | 50,000 行検証は本タスクのスコープ外 |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| `gh` CLI が認証済 | `gh auth status` |
| Node 24 / pnpm 10 が解決済 | `mise install && mise exec -- node -v` |
| 既存 schema alias back-fill 仕様が参照可能 | `test -f docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/implementation-guide.md` |
| 既存 0014 migration が参照可能 | `test -f apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` |
| staging 環境で 10,000 行以上 fixture を流せる | `bash scripts/cf.sh d1 list` で staging DB 到達確認 |
| `EXPLAIN QUERY PLAN` 取得経路が確立済 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --command "EXPLAIN QUERY PLAN SELECT 1"` |

## 苦戦箇所・知見（unassigned-task 仕様 §9 / §「苦戦箇所」継承）

1. **remaining-scan の累計 CPU 時間は実装側から判断不能**: 現行 batch は CPU budget exhausted を retryable continuation で吸収するため、staging evidence 無しでは cursor 化の必要性を結論できない。本タスクは shadow A/B を経由して必ず evidence ベースで判断する。
2. **cursor 列の更新タイミング**: 各 row 単位で cursor を進めると dedupe（既存 0014 制約）と競合し row skip が起きる。本タスクは batch 単位で確定し、failed_items_json に残った row がある場合は cursor を失敗 row より先に進めない。失敗 row は次 batch の再処理対象または明示的な retry/DLQ 状態へ遷移した後にのみ cursor commit できる。
3. **API contract `backfill.status` 不変**: cursor 化は internal 実装の改善に限定する。`backfill.status` の値域に cursor 概念を露出してはならない（contract drift 禁止）。
4. **shadow flag の default**: `BACKFILL_CURSOR_MODE` 未設定時は `remaining-scan` を選ぶ。これにより本タスク途中段階でも production / staging の挙動は不変。
5. **migration 番号衝突**: 既存リポジトリには `0014_*.sql` が複数並走している。cursor 採用時の新 migration は `0015_*` 帯に置く（具体ファイル名は Phase 2 で確定）。

## 想定変更ファイル一覧

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts` | 編集 | shadow flag 分岐 + cursor 経路の batch loop |
| `apps/api/src/repository/schemaDiffQueue.ts` | 編集 | `getNextBatchByCursor(cursor, limit)` / `updateBatchCursor(diffId, cursor)` 追加 |
| `apps/api/migrations/0015_schema_diff_queue_cursor.sql` | 新規（cursor 採用時のみ） | cursor 列追加 migration（up/down 両方）。本仕様書内の canonical migration filename |
| `apps/api/test/**/schemaAliasBackfillBatch.test.ts` | 編集 | cursor 経路 / remaining-scan 経路双方の test |
| `apps/api/test/fixtures/schema-diff-10k.sql` | 編集 or 新規（必要時） | staging 比較用 10,000 行 fixture |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 編集 | 採用判断結果の SSOT 反映 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集 / 再生成 | cursor 関連 anchor 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | `BACKFILL_CURSOR_MODE` / cursor / remaining-scan 等の keyword 追加 |
| `docs/30-workflows/issue-503-.../outputs/phase-12/implementation-guide.md` | 新規 | 採用判断 + 数値 evidence + 反映先一覧 |

## Phase 構成（13 Phase）

| Phase | 目的 | 状態 |
| --- | --- | --- |
| [1](phase-01.md) | 要件定義 / GO 判定 / cursor 採用判断フレームワーク確定（しきい値・evidence 種別） | completed |
| [2](phase-02.md) | cursor 列 schema 設計 / migration 0015 skeleton 設計 | completed |
| [3](phase-03.md) | shadow flag / repository / batch I/F 設計（関数シグネチャ確定） | completed |
| [4](phase-04.md) | 統合テスト設計（vitest / cursor & remaining-scan 双方シナリオ） | completed |
| [5](phase-05.md) | cursor 列 migration 実装（shadow 段階は既存 `backfill_cursor` 再利用、0015 は採用時のみ） | completed |
| [6](phase-06.md) | repository 実装（`getBackfillCursor` / `updateBackfillCursor`） | completed |
| [7](phase-07.md) | workflow 層 shadow flag 実装（環境変数解釈 / batch 分岐） | completed |
| [8](phase-08.md) | runbook / staging 比較手順実装（Phase 11 evidence manifest） | completed |
| [9](phase-09.md) | SSOT 反映（aiworkflow-requirements references / topic-map / keywords） | completed |
| [10](phase-10.md) | 単体テスト実装（cursor 経路 / remaining-scan 経路双方） | completed |
| [11](phase-11.md) | runtime evidence 取得（staging 10k fixture / EXPLAIN QUERY PLAN / CPU 時間 / retry_count） | blocked_runtime_evidence_pending |
| [12](phase-12.md) | implementation-guide / 採用判断記録 / unassigned 検出 / skill feedback / compliance | completed |
| [13](phase-13.md) | commit / PR 作成（user gate） | pending |

## Outputs 導線

| Phase | Output |
| --- | --- |
| 1 | [outputs/phase-1/phase-1.md](outputs/phase-1/phase-1.md) |
| 2 | [outputs/phase-2/phase-2.md](outputs/phase-2/phase-2.md) |
| 3 | [outputs/phase-3/phase-3.md](outputs/phase-3/phase-3.md) |
| 4 | [outputs/phase-4/phase-4.md](outputs/phase-4/phase-4.md) |
| 5 | [outputs/phase-5/phase-5.md](outputs/phase-5/phase-5.md) |
| 6 | [outputs/phase-6/phase-6.md](outputs/phase-6/phase-6.md) |
| 7 | [outputs/phase-7/phase-7.md](outputs/phase-7/phase-7.md) |
| 8 | [outputs/phase-8/phase-8.md](outputs/phase-8/phase-8.md) |
| 9 | [outputs/phase-9/phase-9.md](outputs/phase-9/phase-9.md) |
| 10 | [outputs/phase-10/phase-10.md](outputs/phase-10/phase-10.md) |
| 11 | [outputs/phase-11/phase-11.md](outputs/phase-11/phase-11.md) |
| 12 | [outputs/phase-12/phase-12.md](outputs/phase-12/phase-12.md) |
| 13 | [outputs/phase-13/phase-13.md](outputs/phase-13/phase-13.md) |

## 完了条件（DoD: タスク全体）

### 機能要件

- [ ] staging で 10,000 行 fixture を流したときの remaining-scan vs cursor の比較 evidence（CPU 時間 / 残行数 / retry_count / `EXPLAIN QUERY PLAN`）が `outputs/phase-11/` 配下に記録されている
- [ ] 採用 / 不採用判断が Phase 1 のしきい値表に従って決定され、`outputs/phase-12/implementation-guide.md` に数値根拠付きで記録されている
- [ ] 採用時、`backfill.status` の API contract（値域 / フィールド）に変更が無いことが test で保証されている
- [ ] 不採用時、shadow flag / cursor 経路コードが完全に除去されている

### 品質要件

- [ ] cursor 採用時、cursor 列の初期化・更新が dedupe / failed_items_json と整合（row skip しない）
- [ ] 採用 / 不採用いずれの場合も既存 schemaAliasBackfillBatch test が壊れていない
- [ ] 採用時、`migrations/0015_schema_diff_queue_cursor.sql` が既存 0014 群と互換（up / down 両方が staging で apply 可能）
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` clean

### ドキュメント要件

- [ ] aiworkflow-requirements の `references/database-schema.md` / `indexes/topic-map.md` / `indexes/keywords.json` が採用結果に合わせて更新済み
- [ ] `mise exec -- pnpm indexes:rebuild` 後に skill indexes drift が無い
- [ ] PR 本文に `Refs: #503` / `priority:low` / `type:improvement` / `scale:medium` / `area:api` が付与される

## 参照情報

- 起票元 unassigned spec: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md`
- 親タスク（local implementation GO / runtime evidence pending）: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/`
- 親タスク Phase 12 implementation-guide: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/implementation-guide.md`
- 親タスク Phase 12 unassigned 検出: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md`
- 対象実装（既存）: `apps/api/src/workflows/schemaAliasBackfillBatch.ts` / `apps/api/src/repository/schemaDiffQueue.ts`
- 既存 migration: `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql`
- 類似 spec フォーマット: `docs/30-workflows/issue-348-09c-github-release-tag-automation/`
