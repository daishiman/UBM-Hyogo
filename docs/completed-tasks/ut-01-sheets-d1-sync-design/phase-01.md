# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-d1-sync-design |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

UT-01 の要件を整理し、Sheets → D1 同期方式設計の前提条件・受入条件・スコープを確定する。上流タスクの完了状態を確認し、設計 Phase（Phase 2）が迷いなく着手できる入力を固定する。

## 実行タスク

- 上流タスク（02-serial-monorepo-runtime-foundation / 01b / 01c）の完了状態を確認する
- タスク分類を `docs-only` として記録し、Phase 12 の実装状況は `spec_created` で閉じる前提を固定する
- `artifacts.json` の canonical artifact 名を先に確定し、Phase 間の成果物名ドリフトを防ぐ
- `git log --oneline -5` で前タスクの成果物を棚卸しし、本タスクの新規作業との差異を明確化する
- 既存コードの命名規則・対象コード変更有無を確認する。docs-only のためコード命名規則変更は N/A と記録する
- Google Sheets を入力源・D1 を canonical store とする前提条件を明文化する
- 同期方式候補（push / pull / webhook / cron）を洗い出し、評価軸を設定する
- AC-1〜AC-7 の各条件が Phase 2 の設計で充足できることを確認する
- Sheets API quota 制限・D1 binding 制約などの外部制約を列挙する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/completed-tasks/03-serial-data-source-and-storage-contract/index.md | データソース・ストレージ契約方針の確認 |
| 必須 | docs/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | `sync_audit` / `response_id` 既存契約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | D1 / Sheets の役割と制約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare Workers / Cron Triggers の無料枠・制約 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 実行手順

### ステップ 1: 上流タスク完了確認

- `git log --oneline -5` を確認し、前タスクの完了内容と本タスクの新規設計範囲を `requirements.md` に記録する。
- 02-serial-monorepo-runtime-foundation が完了し、pnpm workspace が機能していることを確認する。
- 01b-parallel-cloudflare-base-bootstrap で D1 binding が設定済みであることを確認する。
- 01c-parallel-google-workspace-bootstrap で Sheets API 認証基盤が設定済みであることを確認する。
- 未完了の上流タスクがある場合は blocker として記録し、Phase 2 に進まない。

### ステップ 1.5: タスク分類・成果物名・命名規則の固定

- タスク分類は `docs-only`、Phase 12 の実装状況は `spec_created` として記録する。
- `artifacts.json` と `index.md` の task path / outputs / Phase 名が一致していることを確認する。
- canonical artifact 名は `outputs/phase-01/requirements.md`、`outputs/phase-02/design.md`、`outputs/phase-02/sync-flow.md`、`outputs/phase-05/sync-method-comparison.md`、`outputs/phase-05/sequence-diagrams.md`、`outputs/phase-05/sync-audit-contract.md`、`outputs/phase-05/retry-policy.md`、`outputs/phase-12/implementation-guide.md`、`outputs/phase-12/system-spec-update-summary.md`、`outputs/phase-12/documentation-changelog.md`、`outputs/phase-12/unassigned-task-detection.md`、`outputs/phase-12/skill-feedback-report.md`、`outputs/phase-12/phase12-task-spec-compliance-check.md` とする。
- コード変更は含まないため、camelCase / kebab-case 等のコード命名規則分析は N/A。ただし Markdown ファイル名は kebab-case、Phase 出力は `outputs/phase-XX/*.md` に統一する。
- targeted test run は docs-only のため通常の `pnpm test` ではなく、リンク・JSON・skill validation を Phase 9 / 12 で実行する方針を記録する。

### ステップ 2: 要件整理と同期方式候補洗い出し

- Sheets を入力源・D1 を canonical store とする source-of-truth 優先順位を確認する。
- 同期方式候補（push / pull / webhook / cron）を評価軸（無料枠 / 実装コスト / 信頼性 / 冪等性）で整理する。
- 冪等性確保の前提として、Sheets 行に一意キーがない問題を要件として記録する。
- Sheets API の quota 制限（500 req/100s）を外部制約として明記する。
- 既存 `sync_audit` の必要性（部分失敗時の監査・再開判断・タイムスタンプ記録）を要件として確認する。

### ステップ 3: AC・4条件確認

- AC-1〜AC-7 が Phase 2 の設計で充足可能かを事前チェックする。
- 価値性 / 実現性 / 整合性 / 運用性の観点で要件に抜けがないか確認する。
- 次 Phase に渡す open question と blocker を requirements.md に記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 本 Phase の requirements.md を設計の入力として使用 |
| Phase 7 | AC-1〜AC-7 のトレース根拠として使用 |
| Phase 10 | gate 判定の前提条件確認に使用 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: Sheets 入力 → D1 canonical 化によって誰のどの作業コストが下がるか明確か。
- 実現性: Cloudflare Workers 無料枠・Sheets API 無料枠の範囲で同期設計が成立するか。
- 整合性: source-of-truth の優先順位が CLAUDE.md の不変条件と矛盾しないか。
- 運用性: 同期失敗時のリカバリ手順が存在し、手動バックフィルが可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流タスク完了確認 | 1 | completed | blocker があれば記録 |
| 2 | タスク分類・canonical artifact 名固定 | 1 | completed | docs-only / spec_created / outputs 一覧 |
| 3 | 同期方式候補・評価軸の整理 | 1 | completed | push/pull/webhook/cron の4候補 |
| 4 | 外部制約（quota・binding）の列挙 | 1 | completed | Sheets API 500req/100s 等 |
| 5 | AC-1〜AC-7 の事前チェック | 1 | completed | 充足可能性の確認 |
| 6 | requirements.md の作成 | 1 | completed | outputs/phase-01/requirements.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件・前提条件・外部制約・open question |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- outputs/phase-01/requirements.md が作成済みである
- 上流タスクの完了状態が確認済みである（未完了は blocker として記録済み）
- タスク分類、Phase 12 `spec_created` 扱い、canonical artifact 名が `index.md` / `artifacts.json` と一致している
- 前タスク carry-over と本タスク新規作業との差異が記録されている
- docs-only のためコード命名規則分析と targeted `pnpm test` は N/A であり、代替検証コマンドが Phase 9 / 12 に引き継がれている
- 同期方式候補4種の評価軸が定義済みである
- AC-1〜AC-7 の事前充足可能性が確認済みである
- Sheets API quota 制限と D1 binding 制約が外部制約として明記済みである

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（上流タスク未完了 / quota 制約違反 / D1 binding 未設定）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: outputs/phase-01/requirements.md の要件・評価軸・open question を Phase 2 の設計入力とする。
- ブロック条件: 本 Phase の requirements.md が未作成、または上流タスクに未解決 blocker がある場合は Phase 2 に進まない。

## 真の論点

- Sheets の行に一意キーがない問題をどう解決するか（バンドマン固有 ID vs ハッシュ管理）。
- 無料枠内で定期同期の信頼性をどこまで保証するか。

## 依存関係・責務境界

- 本 Phase は「設計前の要件確定」に専念し、設計判断は Phase 2 に委ねる。
- Sheets API 認証実装（→ UT-03）・D1 物理スキーマ（→ UT-04）・同期コード実装（→ UT-09）は本タスクのスコープ外とする。

## 価値とコスト

- 初回価値: 設計 Phase に入る前に、方式評価軸と外部制約を共有財として固定する。
- 初回で払わないコスト: 実際の同期コード実装・D1 スキーマ定義・本番データ投入。

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | Sheets → D1 同期で誰のどのコストを下げるか定義されているか | TBD |
| 実現性 | 無料枠の範囲で同期設計が成立するか | TBD |
| 整合性 | source-of-truth 優先順位が不変条件と矛盾しないか | TBD |
| 運用性 | 同期失敗時のリカバリ・バックフィルが可能か | TBD |

## 既存資産インベントリ

| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| 上流タスク | 02-serial / 01b / 01c の完了状態 | 要確認 |
| 参照仕様 | 03-serial-data-source-and-storage-contract/index.md | 要確認 |
| 外部制約 | Sheets API quota / D1 binding / Cron Triggers 無料枠 | 要確認 |
| legacy drift | 既存同期設計との差分 | 要確認 |
