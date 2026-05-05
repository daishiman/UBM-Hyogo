# issue-195-sync-jobs-contract-schema-consolidation-001 - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-issue-195-sync-jobs-contract-schema-consolidation-001 |
| タスク名 | sync_jobs job_type / metrics_json runtime contract 集約（runtime SSOT 配置 ADR + owner 表登録 + contract test 補強） |
| ディレクトリ | docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001 |
| Issue | #435 (CLOSED — クローズドのまま実装仕様化 / `Refs #435`) |
| 親タスク | docs/30-workflows/completed-tasks/03b-followup-005-sync-jobs-design-spec |
| 関連タスク | docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner |
| 起票元 unassigned | docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md |
| Wave | 5 |
| 実行種別 | parallel（実装仕様書） |
| 担当 | backend-sync |
| 作成日 | 2026-05-04 |
| 状態 | implemented-local / Phase 1-12 completed / Phase 13 pending_user_approval |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |
| 実装区分 | 実装仕様書（CONST_004 例外条件適用） |

### CONST_004 例外条件の適用根拠

ユーザー指定は当初 docs-only に近い「集約 / 確認」であったが、目的達成のためには (a) **runtime SSOT 配置の最終決定 ADR**（`apps/api/src/jobs/_shared/sync-jobs-schema.ts` を維持するか `packages/shared` に移管するか）、(b) **owner 表行追加**（`_design/sync-shared-modules-owner.md`）、(c) **contract test 補強**（`apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` で canonical 値網羅性を埋める）が必須となり、markdown 単独では完結しない。よって CONST_004 の例外条件（実態優先）に基づき、本タスクは **実装仕様書** として作成する。

owner = 主担当 / co-owner = サブ担当（用語 alias、L-005 引き継ぎ）。

## 目的

03b-followup-005（Issue #198）で `apps/api/src/jobs/_shared/sync-jobs-schema.ts` が新設され runtime 値（`SYNC_JOB_TYPES` / `SYNC_LOCK_TTL_MS` / `metricsJsonBaseSchema` 等）と consumer 差し替えは完了している。Issue #435 の残スコープは下記:

1. **runtime SSOT 配置の ADR 化**: `apps/api` 維持を結論として根拠と alternative（`packages/shared` 移管）を `_design/sync-jobs-spec.md` に明文化。
2. **owner 表への runtime SSOT 登録**: `_design/sync-shared-modules-owner.md` に `apps/api/src/jobs/_shared/sync-jobs-schema.ts` 行を追加（owner: 03a / co-owner: 03b）。
3. **contract test の canonical 値網羅補強**: `SYNC_JOB_TYPES` の正規 2 値、`SYNC_LOCK_TTL_MS = 600000` 値、`metricsJsonBaseSchema` の PII 拒否ケースが網羅されているかを再確認し、不足があれば追加。
4. **markdown 論理正本（`_design/sync-jobs-spec.md`）の参照更新**: §2 / §3 / §5 に runtime SSOT への 1-hop 参照リンクと owner 表へのリンクを追記。
5. **`.claude/skills/aiworkflow-requirements/references/database-schema.md`** の `sync_jobs` 節再確認（既に整合していれば no-op を evidence に記録）。
6. **unassigned-task のステータス解消**: `docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md` の status を `unassigned` → `resolved` に更新する手順を Phase 8 / 12 で記述。
7. **indexes 再生成**: `mise exec -- pnpm indexes:rebuild` で drift なし。

## スコープ

### 含む（本 PR / 1 実装サイクルで完了）

- ADR 追記: `docs/30-workflows/_design/sync-jobs-spec.md`（§1 メタ表または冒頭セクションに「runtime SSOT 配置 ADR」追加）
- owner 表行追加: `docs/30-workflows/_design/sync-shared-modules-owner.md`
- contract test 補強（不足時のみ）: `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts`
- runtime PII guard 補強（不足時のみ）: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `metricsJsonBaseSchema` / `assertNoPii` が email 形式値も拒否するように最小拡張
- 参照リンク追記: `_design/sync-jobs-spec.md` §2 / §3 / §5
- `database-schema.md` の `sync_jobs` 節再確認（必要なら更新）
- unassigned-task ステータス更新: `docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md`
- `mise exec -- pnpm indexes:rebuild` による drift 解消と evidence 保存

### 含まない

- `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の物理移管・job_type / TTL semantics 変更（PII guard の email 形式値拒否補強は AC-4 達成のため scope in）
- `sync_jobs` テーブルの DDL 変更
- D1 マイグレーション新規追加
- `packages/shared` への物理移管（ADR で「不採用」と結論する想定）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 03b-followup-005-sync-jobs-design-spec (Issue #198) | runtime SSOT 実体の作成完了 |
| 上流 | issue-195-03b-followup-002-sync-shared-modules-owner | owner 表 foundation 確立 |
| 下流 | 後続 sync wave（job_type 追加時に SSOT + owner 表 + markdown 論理正本を 1-hop で更新） |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md | 起票元 unassigned spec / AC / 苦戦箇所 L-001〜L-005 |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | markdown 論理正本（ADR / 参照リンク追加対象） |
| 必須 | docs/30-workflows/_design/sync-shared-modules-owner.md | owner 表（行追加対象） |
| 必須 | apps/api/src/jobs/_shared/sync-jobs-schema.ts | runtime SSOT 実体（PII guard 補強対象） |
| 必須 | apps/api/src/jobs/_shared/sync-jobs-schema.test.ts | contract test（必要時のみ補強） |
| 必須 | docs/30-workflows/completed-tasks/03b-followup-005-sync-jobs-design-spec/ | 先行完了タスク（実装根拠） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 節（参照確認対象） |
| 推奨 | .github/workflows/verify-indexes.yml | indexes drift 検証 CI gate |
| 推奨 | .claude/skills/aiworkflow-requirements/references/lessons-learned-issue-195-03b-followup-sync-shared-modules-owner-2026-05.md | L-001〜L-005 出典 |

## 受入条件 (AC)

- AC-1: `_design/sync-jobs-spec.md` に「runtime SSOT 配置 ADR: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` 維持 / `packages/shared` 不採用」が決定根拠（CLAUDE.md 不変条件 5「D1 アクセスは apps/api に閉じる」/ `apps/web` 参照ゼロ / `packages/shared` 参照ゼロ）つきで記載されている
- AC-2: `_design/sync-shared-modules-owner.md` の owner 表に `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の行（owner: 03a / co-owner: 03b）が追加されている
- AC-3: `_design/sync-jobs-spec.md` §2 / §3 / §5 に runtime SSOT への 1-hop 参照リンクと owner 表（`sync-shared-modules-owner.md`）へのリンクが入っている
- AC-4: `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` の canonical contract カバレッジ（`SYNC_JOB_TYPES === ["schema_sync","response_sync"]` 値断言 / `SYNC_LOCK_TTL_MS === 600000` 値断言 / `metricsJsonBaseSchema` の PII キー拒否 / email 形式値拒否）が網羅されている。不足があれば追加されている
- AC-5: `.claude/skills/aiworkflow-requirements/references/database-schema.md` の `sync_jobs` 節が `_design/sync-jobs-spec.md` 参照に統一されている（再確認 / 必要なら更新。no-op の場合も evidence にその旨を記録）
- AC-6: `docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md` の `status` が `unassigned` から `resolved`（または `closed`）へ更新され、解消先 PR / 完了タスクパスへのリンクが付与されている
- AC-7: `mise exec -- pnpm indexes:rebuild` 実行後、生成差分（topic-map / keywords 等）が同 PR 範囲に含まれ、再実行で追加 drift が出ない
- AC-8: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test` が全てパスする

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義（Why/What/不変条件/4条件評価/AC 再マッピング/苦戦箇所引き継ぎ） | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計（runtime SSOT 配置 ADR 構成 + owner 表行スキーマ + 参照リンク経路） | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 実装計画（変更ファイル一覧 + 編集順序 + ロールバック手順） | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | verify suite 設計（typecheck / vitest / grep / indexes drift / 1-hop 到達 grep） | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 既存 contract test カバレッジ棚卸し（不足ケース抽出） | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | runtime SSOT 配置 ADR 追記 + owner 表行追加 + 参照リンク追記 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | contract test 補強（不足時のみ） + database-schema.md 参照再確認 | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | unassigned-task ステータス更新 + 03a/03b spec への 1-hop 参照確認 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | indexes 再生成 + drift 検証 + typecheck/lint/test 実行 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | レビュー + 整合確認（ADR と owner 表と markdown 論理正本の 1:1 対応） | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | NON_VISUAL evidence 収集（grep / typecheck / vitest / indexes diff / 1-hop 到達） | phase-11.md | completed | outputs/phase-11/main.md + *.log |
| 12 | 実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback（中学生レベル概念説明含む / strict 7 ファイル） | phase-12.md | completed | outputs/phase-12/ 一式 |
| 13 | PR 作成準備（Refs #435・user approval required） | phase-13.md | pending_user_approval | outputs/phase-13/pr-body.md |

## 実行原則

- **CONST_007 遵守**: 全変更を 1 PR / 1 実装サイクルで完了させる。先送り・別 PR 提案は禁止。
- runtime SSOT の物理位置は変えない（`apps/api/src/jobs/_shared/sync-jobs-schema.ts` 維持）。ADR で「不採用」と結論し、根拠を記録する。
- owner / co-owner と 主担当 / サブ担当の用語混在を避ける（L-005、冒頭 alias 表）。
- markdown 論理正本（`_design/sync-jobs-spec.md`）と TS runtime SSOT の 1-hop 参照リンクを必ず確保する。
- `Refs #435` を採用、`Closes` は使用しない（Issue は CLOSED）。
- 検出した drift は同 PR で解消する。

## 苦戦箇所【unassigned spec から引き継ぎ】

出典: `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-195-03b-followup-sync-shared-modules-owner-2026-05.md`

- **L-001 classification-first（governance vs runtime spec vs task output）**: 共有モジュール文書は `runtime spec` / `task workflow output` / `workflow governance design` の3軸で分類する。本タスクの `job_type` enum / `metrics_json` schema 集約は **runtime spec** に該当するため、TS 実体は `apps/api` 配下に置き、`_design/` に置かない。
- **L-002 current canonical path 削除 guard**: `sync_jobs` schema 関連 path 削除（D 差分）が発生する場合は `legacy-ordinal-family-register.md` の §Current Alias Overrides に move destination を行追加する。`D` 単独はブランチ全体 4 条件の自動 FAIL とする。
- **L-003 docs-only governance owner 表テンプレ未整備**: governance 文書の Phase 6-11 AC（5列 schema 検証 / リンク 1-hop 到達 grep / secret-hygiene grep / NON_VISUAL evidence 3 ファイル）は都度組み立て。本タスクで `_design/sync-shared-modules-owner.md` に行追加する場合は同 AC を再実行する。
- **L-004 Phase 12 strict 7 filenames drift**: Phase 12 出力は `main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` の 7 ファイル固定。`system-spec-update.md` 等の旧名混入禁止。
- **L-005 用語不整合（owner / co-owner と 主担当 / サブ担当）**: 本タスクで新規追加する schema document には冒頭に「owner = 主担当 / co-owner = サブ担当」alias 表を 1 行入れる。
