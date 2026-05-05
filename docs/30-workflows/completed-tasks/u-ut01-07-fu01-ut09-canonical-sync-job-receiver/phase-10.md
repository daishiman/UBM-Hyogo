# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver (U-UT01-07-FU01) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート |
| 作成日 | 2026-05-01 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動テスト検証 / NON_VISUAL 縮約) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| sourceIssue | #333 (CLOSED) |

## 目的

Phase 1〜9 で蓄積した受け皿仕様 / canonical 名 const 設計 / grep ガード script 仕様 / CI gate 雛形 / aiworkflow drift 実測結果を横断レビューし、AC-1〜AC-4 全件 PASS と 4 条件（価値性 / 実現性 / 整合性 / 運用性）を確定する。
さらにコード境界網羅性（const ファイル / script / hook / CI gate の 4 点）、U-UT01-08 / 09・UT-04 直交性、drift 解消方針を Go/No-Go 判定に組み込み、Phase 11（NON_VISUAL 縮約 manual evidence）への進行可否を確定する。

## 判定基準

| 判定 | 条件 | 対応 |
| --- | --- | --- |
| PASS（GO） | AC 全 PASS / 7 検証項目 PASS / コード境界網羅 / 直交性 OK / drift 方針確定 / skill-feedback 提出 | Phase 11 へ進行 |
| MINOR | 軽微指摘あり（line budget 微逸脱・cross-link 軽微切れ等） | 未タスク化記録後 Phase 11 へ進行 |
| MAJOR | 重大問題あり（canonical 名集約未確定 / grep ガード未仕様化 / 直交侵食 / drift 解消方針未定 / CI gate 未定義） | 該当 Phase へ戻り |
| CRITICAL | 致命問題（受け皿パス確定不能 / canonical 名採択覆る等） | Phase 1 へ戻り再要件化 |

## 実行タスク

1. AC-1〜AC-4 達成状態評価（spec_created 視点）（完了条件: 全件 PASS / FAIL 確定）。
2. 7 検証項目評価（typecheck / lint / canonical 名 grep / pre-commit hook / 文書整合 / drift / CI gate）（完了条件: 全 PASS）。
3. コード境界網羅性確認（const ファイル / script / hook / CI gate yaml の 4 点が Phase 8〜9 で仕様確定）（完了条件: 4 点すべて確定）。
4. 直交性チェック（U-UT01-08 / U-UT01-09 / UT-04 への侵食 0）（完了条件: 侵食 0）。
5. drift 解消方針確定（aiworkflow-requirements `database-schema.md`）（完了条件: Phase 12 doc-only 更新案の有無確定）。
6. MAJOR / MINOR 戻り条件と未タスク化方針確定（完了条件: ルール明文化）。
7. Go/No-Go 判定確定（完了条件: `outputs/phase-10/go-no-go.md` に GO 記述 + skill-feedback 提出）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-09.md | 品質ゲート結果 |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/phase-02/ | 単一正本群 |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-09 受け皿確定対象 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/ | 親タスク（SSOT 提供元） |
| 参考 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/phase-10.md | 書式模倣元 |

## GO / NO-GO 判定マトリクス（AC × 達成状態）

> **評価基準**: spec_created 段階のため、「Phase 1〜9 で具体的に確定し、UT-09 実装担当者が本仕様書のみで着手可能な粒度に分解されているか」で判定する。

| AC | 内容 | 達成状態 | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | UT-09 実装タスク root の実パス確定 | 仕様確定 | Phase 2 `outputs/phase-02/ut-09-receiver-path.md`（または同等） | PASS |
| AC-2 | canonical 名（`sync_job_logs` / `sync_locks`）が UT-09 必須参照・AC に反映 | 仕様確定 | Phase 2 `canonical-reference-table.md` + UT-09 receiver path 反映差分 | PASS |
| AC-3 | `sync_log` 物理テーブル化禁止が明記（CREATE/RENAME/DROP 禁止） | 仕様確定 | Phase 2 `code-scope.md` + grep ガード仕様 | PASS |
| AC-4 | U-UT01-08 / 09・UT-04 直交性維持 | 仕様確定 | Phase 2 `orthogonality-checklist.md` + Phase 7 AC マトリクス | PASS |

## 7 検証項目評価

| # | 項目 | 確認元 Phase | 判定 |
| --- | --- | --- | --- |
| 1 | typecheck | Phase 9 静的検証 | PASS（spec 段階・実行は Phase 11） |
| 2 | lint | Phase 9 静的検証 | PASS |
| 3 | canonical 名 grep ガード（5 パターン） | Phase 8 / 9 | PASS |
| 4 | pre-commit hook（`canonical-sync-names-guard.sh` + lefthook.yml） | Phase 9 | PASS |
| 5 | 文書整合 grep（index ↔ outputs AC 一致） | Phase 9 | PASS |
| 6 | aiworkflow-requirements drift 実測 | Phase 9 | PASS（実測は Phase 11 で発火） |
| 7 | CI gate 雛形（`verify-canonical-sync-names.yml`） | Phase 9 | PASS |

## 4 条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 実装担当者が canonical 名で迷わず着手でき、grep ガード + CI gate により drift を PR 段階で検出。 |
| 実現性 | PASS | const ファイル 1 + script 1 + hook 1 + workflow yaml 1 の最小追加で完結し、既存 migration を改変しない。 |
| 整合性 | PASS | 不変条件 #5（D1 access apps/api 内閉鎖）を維持し、`apps/api/src/sync/canonical-names.ts` も配下に閉じる。既存 `apps/api/migrations/0002_sync_logs_locks.sql` を改変せず物理 canonical として尊重。 |
| 運用性 | PASS | pre-commit hook + CI gate の二重防御で UT-09 実装後も canonical 違反が即検出される。 |

**最終判定: GO（PASS）**

## コード境界網羅性確認

| # | 境界 | 仕様確定先 | 確定状況 |
| --- | --- | --- | --- |
| 1 | `apps/api/src/sync/canonical-names.ts`（const export 仕様） | Phase 8 ステップ 1 | 確定 |
| 2 | `scripts/check-canonical-sync-names.sh`（grep ガード本体） | Phase 8 ステップ 3 / Phase 9 静的検証 | 確定 |
| 3 | `scripts/hooks/canonical-sync-names-guard.sh` + `lefthook.yml`（pre-commit hook） | Phase 9 ステップ 2 | 確定 |
| 4 | `.github/workflows/verify-canonical-sync-names.yml`（CI gate 雛形） | Phase 9 ステップ 6 | 確定 |

## 直交性チェック

| 直交対象 | 本タスクのスコープ境界 | 判定 |
| --- | --- | --- |
| U-UT01-08（sync 状態 enum / trigger enum 統一） | enum 値の決定を含まない。canonical 名のみ確定。 | OK（侵食 0） |
| U-UT01-09（retry 回数 / offset resume 統一） | 数値ポリシー決定を含まない。 | OK（侵食 0） |
| UT-04（D1 schema 設計） | DDL 発行を行わない。既存 migration を尊重。 | OK（境界明確） |
| UT-09（Sheets→D1 同期ジョブ実装） | 受け皿確定のみ。mapper / job ロジック実装は UT-09 のスコープ。 | OK（境界明確） |
| 親 U-UT01-07（命名 reconciliation） | 親が確定した canonical 名を継承するのみ・採択ロジックは再議論しない。 | OK（継承関係明確） |

## drift 解消方針

- Phase 9 で drift 実測計画を確定済み。
- Phase 11 manual-smoke-log で `rg "sync_log\|sync_logs\|sync_job_logs\|sync_locks\|CREATE TABLE" .claude/skills/aiworkflow-requirements/references/database-schema.md` を実行し結果採取。
- drift 検出時は Phase 12 で doc-only 更新案を `.claude/skills/aiworkflow-requirements/references/database-schema.md` に対する diff として成果物化（mirror sync は `.agents` 側にも反映）。
- drift なし時は AC-2 / AC-3 を「既存 drift なし / canonical 名は migration 参照のみ」として close。

## MAJOR / MINOR 戻り条件

| 判定 | 戻り先 | 理由 |
| --- | --- | --- |
| MINOR（line budget 軽微逸脱） | Phase 8 | DRY 化で再分割 |
| MINOR（cross-link 軽微切れ） | Phase 8 | navigation drift 修正 |
| MAJOR（canonical 名集約未確定） | Phase 8 | const ファイル仕様再構築 |
| MAJOR（grep ガード未仕様化） | Phase 9 | script 仕様再構築 |
| MAJOR（CI gate 未定義） | Phase 9 | yaml 雛形再構築 |
| MAJOR（直交侵食） | Phase 2 | 採択ロジック再検討 |
| MAJOR（drift 解消方針未定） | Phase 9 | drift 実測計画再構築 |
| CRITICAL（受け皿パス確定不能） | Phase 1 | 要件再確認 |
| CRITICAL（canonical 名採択覆る） | 親 U-UT01-07 にエスカレーション | 親タスク再 open |

## MINOR 判定の未タスク化方針

- 本タスクで MINOR が出た場合は **必ず未タスク化** する（`docs/30-workflows/unassigned-task/` 配下に新規 .md 起票）。
- Phase 12 `unassigned-task-detection.md` に該当 ID を記載し、次 Wave 以降の優先度評価に回す。
- 本 Phase 時点では MINOR は **想定なし**（4 条件全 PASS / AC 全 PASS / 7 検証項目 PASS）。

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | aiworkflow-requirements drift 検出時の更新案最終形 | Phase 11（実測）/ Phase 12（適用案） | 計画済み |
| 2 | UT-09 実装着手時に canonical-names.ts を本タスク内で発火するか UT-09 内で発火するか | Phase 12 で発火スコープを明示確定 | 計画済み |
| 3 | CI gate を branch protection の必須化に組み込むタイミング | UT-GOV 系タスク or UT-09 マージ後 | 申し送り |

## Phase 11 進行 GO / NO-GO

### GO 条件（すべて満たすこと）

- [ ] AC-1〜AC-4 すべて PASS
- [ ] 7 検証項目すべて PASS
- [ ] コード境界 4 点すべて確定
- [ ] 4 条件最終判定 PASS
- [ ] 直交性侵食 0
- [ ] drift 解消方針確定
- [ ] skill-feedback 提出（task-specification-creator スキルへ Phase 8〜10 作成体験のフィードバック）
- [ ] MAJOR が一つもない

### NO-GO 条件（一つでも該当）

- AC のうち PASS でないものがある
- 7 検証項目のいずれかが未確定
- コード境界 4 点のうち未確定がある
- 直交侵食が検出される
- drift 解消方針が未定
- CI gate 雛形が未定義

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 7 / Phase 9 を基に AC-1〜AC-4 を spec_created 視点で評価。

### ステップ 2: 7 検証項目評価
- Phase 9 結果を統合。

### ステップ 3: コード境界網羅性確認
- 4 点（const / script / hook / CI gate）の仕様確定状況を確認。

### ステップ 4: 4 条件最終判定
- Phase 3 base case + Phase 9 QA を統合。

### ステップ 5: 直交性チェック
- U-UT01-08 / 09 / UT-04 / UT-09 / 親 U-UT01-07 の境界確認。

### ステップ 6: drift 解消方針確定
- Phase 9 計画 + Phase 11 実測 + Phase 12 適用ルートを確定。

### ステップ 7: Go/No-Go 確定 + skill-feedback 提出
- `outputs/phase-10/go-no-go.md` に GO 判定記述、skill-feedback を task-specification-creator に提出。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に NON_VISUAL 縮約 manual evidence を採取（drift 実測 + grep ガード script 動作確認） |
| Phase 12 | drift 検出時の doc-only 更新案 + canonical-names.ts 発火スコープを formalize |
| Phase 13 | GO/No-Go 結果 + CI gate 雛形を PR description に転記 |
| UT-09 | canonical 名 const + 必須参照 + 物理化禁止ルールを mapper / job 実装の入力に使用 |
| UT-04 | 既存 migration 改変禁止の継続的尊重 |

## 多角的チェック観点

- 価値性: UT-09 実装着手時の再質問を 0 にし、CI gate で drift を継続防止。
- 実現性: 最小追加（const + script + hook + yaml）で完結。
- 整合性: 不変条件 #5 維持・既存 migration 尊重・親 U-UT01-07 採択を継承。
- 運用性: pre-commit + CI の二重防御。
- 認可境界: 本 Phase は読み取りのみで権限境界を変更しない。
- 直交性: U-UT01-08 / 09・UT-04・UT-09 への侵食 0、親 U-UT01-07 の採択ロジック再議論なし。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-4 達成評価 | 10 | spec_created | 4 件 |
| 2 | 7 検証項目評価 | 10 | spec_created | typecheck/lint/grep/hook/文書整合/drift/CI |
| 3 | コード境界網羅性 | 10 | spec_created | 4 点 |
| 4 | 4 条件最終判定 | 10 | spec_created | PASS |
| 5 | 直交性チェック | 10 | spec_created | U-UT01-08 / 09 / UT-04 / UT-09 / 親 |
| 6 | drift 解消方針確定 | 10 | spec_created | Phase 11 / 12 ルート |
| 7 | Go/No-Go 判定 + skill-feedback | 10 | spec_created | GO + feedback 提出 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | Go/No-Go 判定・AC マトリクス・7 検証項目・コード境界・4 条件・直交性・drift 方針・戻り条件 |
| メタ | artifacts.json | Phase 10 状態の更新 |
| feedback | task-specification-creator スキルへの skill-feedback | Phase 8〜10 作成体験のフィードバック |

## 完了条件

- [ ] AC-1〜AC-4 全件に達成状態が付与されている
- [ ] 7 検証項目すべて PASS
- [ ] コード境界 4 点すべて確定
- [ ] 4 条件最終判定が PASS
- [ ] 直交性侵食 0
- [ ] drift 解消方針が確定
- [ ] MAJOR / MINOR 戻り条件が明文化されている
- [ ] Go/No-Go 判定が GO で確定
- [ ] skill-feedback 提出済み
- [ ] outputs/phase-10/go-no-go.md が作成済み

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` 配置予定
- AC × 7 検証項目 × コード境界 × 4 条件 × 直交性 × drift × 戻り条件 × Go/No-Go の 8 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動テスト検証 / NON_VISUAL 縮約)
- 引き継ぎ事項:
  - GO 判定（spec_created 段階）
  - drift 実測コマンド + grep ガード script 動作確認を Phase 11 manual-smoke-log で実行
  - NON_VISUAL 縮約テンプレ適用（screenshot 不要 / 代替 evidence 採用）
  - canonical-names.ts 発火スコープ（本タスク or UT-09）の確定を Phase 12 で formalize
  - CI gate 雛形を branch protection に組み込むタイミングを UT-GOV 系へ申し送り
- ブロック条件:
  - AC で PASS でないものが残る
  - 7 検証項目のいずれかが未確定
  - drift 解消方針が未定
  - skill-feedback 未提出
