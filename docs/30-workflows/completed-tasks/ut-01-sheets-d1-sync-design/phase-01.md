# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| 上流 | 原典スペック / 上流タスク 3 件（02-serial-monorepo-runtime-foundation / 01b-parallel-cloudflare-base-bootstrap / 01c-parallel-google-workspace-bootstrap） |
| 下流 | Phase 2（設計） |
| 状態 | spec_created |
| タスク種別 | docs-only / design_specification |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| user_approval_required | false |

## 目的

Google Sheets を入力源、Cloudflare D1 を canonical store として、両者間のデータ同期アーキテクチャ（方式・タイミング・エラーハンドリング・冪等性確保・監査証跡）の設計タスクとしてのスコープ・苦戦箇所・受入条件を不可逆化し、Phase 2 設計の入力を凍結する。タスクタイプ `docs-only` / `visualEvidence: NON_VISUAL` / `workflow_state: spec_created` を Phase 1 で確定し、`artifacts.json.metadata` と `index.md` メタ表との一致を保証する。

## 入力

| 種別 | パス / 内容 |
| --- | --- |
| 原典スペック | `docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md` |
| GitHub Issue | #50 (CLOSED) `[UT-01] Sheets→D1 同期方式定義` / labels: priority:high, type:requirements, wave:1 |
| 上流タスク | `02-serial-monorepo-runtime-foundation` / `01b-parallel-cloudflare-base-bootstrap` / `01c-parallel-google-workspace-bootstrap` |
| 下流タスク | UT-03（Sheets API 認証方式設定） / UT-09（Sheets→D1 同期ジョブ実装） |
| 必読 reference | `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` / `deployment-cloudflare.md` / `database-schema.md` |

## タスクタイプ確定（Phase 1 必須入力）

UT-GOV-005 で整備された task-specification-creator skill の docs-only / NON_VISUAL 縮約テンプレ判定ルールに従い、Phase 1 で以下のメタを **必須入力として確定** する：

| メタ | 値 | 根拠 |
| --- | --- | --- |
| `metadata.taskType` | `docs-only` | コード変更なし、設計文書（Markdown / 図）のみを生成。実装は UT-09 で行う |
| `metadata.docs_only` | `true` | 同上 |
| `metadata.visualEvidence` | `NON_VISUAL` | UI 変更なし、screenshot 不要。Phase 11 縮約テンプレを発火させる |
| `metadata.workflow_state` | `spec_created` | 仕様書作成済 / 実装着手前。Phase 12 close-out 後も据え置く（実装完了は UT-09 が担う） |
| `metadata.scope` | `design_specification` | 同期アーキテクチャの設計確定 |

## Schema / 共有コード Ownership 宣言

本タスクは **設計のみ** であり、共有コード（`packages/shared` / `packages/integrations` / `apps/api` / `apps/web`）を **一切変更しない**。`d1_tables` には `sync_log (logical design only)` のみ記載しており、物理スキーマの作成・マイグレーションは行わない（→ UT-04 / UT-09 が担当）。

| 対象 | 本タスクでの扱い |
| --- | --- |
| `packages/shared` 型定義 | 触らない |
| `packages/integrations` Sheets クライアント | 触らない（実装は UT-09） |
| `apps/api` ルート / handler | 触らない（実装は UT-09） |
| D1 物理マイグレーション (`*.sql`) | 触らない（→ UT-04） |
| Cloudflare Secrets | 触らない（→ UT-03 / UT-09） |
| `.env` / 1Password 参照 | 触らない |

## 受入基準（AC）

- AC-1: 同期方式（push / pull / webhook / cron）の比較評価表が `outputs/phase-02/sync-method-comparison.md` に作成
- AC-2: 手動 / 定期 / バックフィルの 3 種フロー図が `outputs/phase-02/sync-flow-diagrams.md` に存在
- AC-3: エラーハンドリング方針（リトライ / Backoff / 冪等性 / 部分失敗 / failed ログ）が文書化
- AC-4: `sync_log` 論理スキーマが `outputs/phase-02/sync-log-schema.md` に定義
- AC-5: source-of-truth 優先順位とロールバック判断フローチャートが明文化
- AC-6: Sheets API quota 対処方針（バッチサイズ・Backoff・待機戦略）が記載
- AC-7: 冪等性担保戦略（行ハッシュ / 固有 ID / UPSERT 前提）が UT-04 引き継ぎ事項として整理
- AC-8: Phase 3 で代替案 3 件以上が PASS / MINOR / MAJOR で評価され base case 確定
- AC-9: UT-09 が本仕様書のみで実装着手可能（open question 0 件）
- AC-10: `metadata.taskType=docs-only` / `visualEvidence=NON_VISUAL` / `workflow_state=spec_created` が Phase 1 で固定され `artifacts.json` と一致

## 実行タスク

1. 原典スペック（`docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md`）の精読、苦戦箇所 4 件＋本タスク特有 2 件（状態誤書換え / 自己完結性）の抽出
2. 上流タスク 3 件（monorepo / cloudflare / google-workspace）の完了状況・成果物の確認
3. 下流タスク（UT-03 / UT-09）の現状把握と本仕様書への要求事項抽出
4. AC-1〜AC-10 を `outputs/phase-01/main.md` に確定記述
5. `artifacts.json.metadata` の Phase 1 必須入力を確定（taskType / visualEvidence / workflow_state / scope）
6. Schema / 共有コード Ownership 宣言を main.md に記載（本タスクが何も変更しないことを明示）
7. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）を main.md で実施

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md` |
| 必須 | `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md`（タスクタイプ判定フロー） |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md`（縮約テンプレ） |
| 参考 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/index.md`（フォーマット模倣元） |

## 検証コマンド

```bash
# 原典スペックの存在確認
ls docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md

# 上流タスクの参照可能性確認
ls docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/index.md \
   docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/index.md || true

# 下流タスクの参照可能性確認
ls docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md

# Issue 状態確認
gh issue view 50 --json state,title,labels
```

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-01/main.md` | 要件定義（背景 / 課題 / 苦戦箇所 / スコープ / AC-1〜AC-10 / 4 条件評価 / Schema Ownership 宣言 / NON_VISUAL 確定根拠） |

`outputs/phase-01/main.md` は本 Phase 実行時に記入する。期待される章立ては以下：
- メタ情報 / タスクタイプ確定（docs-only / NON_VISUAL / spec_created）
- 背景・目的
- スコープ（含む / 含まない）
- 苦戦箇所 7 件
- 受入条件 AC-1〜AC-10
- Schema / 共有コード Ownership 宣言
- 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）
- 不変条件 touched
- 次 Phase 引き継ぎ事項

## 完了条件 (DoD)

- [ ] 原典スペック §「目的」「スコープ」「苦戦箇所・知見」「完了条件」を精読
- [ ] 苦戦箇所 7 件を main.md に転記
- [ ] AC-1〜AC-10 を確定
- [ ] `artifacts.json.metadata` の Phase 1 必須入力（taskType / visualEvidence / workflow_state / scope）が確定
- [ ] Schema / 共有コード Ownership 宣言で「何も変更しない」が明示
- [ ] 4 条件評価で全 PASS

## 苦戦箇所・注意

- **`visualEvidence` メタの確定漏れ**: docs-only タスクで `NON_VISUAL` 設定が漏れると Phase 11 で screenshot 要求が誤発火する。Phase 1 で必須入力として確実に書く
- **`workflow_state` の誤書換え**: 本タスクは設計タスクであり、Phase 12 close-out で `completed` に書き換えてはならない。`spec_created` を据え置く前提を Phase 1 から明文化
- **設計タスクの自己完結性**: AC-9「UT-09 が本仕様書のみで着手可能」を達成するため、Phase 3 / Phase 10 で open question を 0 件にする義務を Phase 1 から要件として確定
- **上流タスク完了の前提**: 上流 3 タスク（monorepo / cloudflare / google-workspace）が未完了だと D1 バインディング名・Sheets 接続先 ID が宙に浮く。Phase 1 着手前に確認必須

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計タスクであり、アプリケーション統合テストは追加しない
- 統合検証は Phase 11 の docs-only / NON_VISUAL 縮約テンプレ（manual-smoke-log.md / link-checklist.md）で代替する
- 下流実装（UT-09）が本仕様書の AC を満たす形で実装テストを行うため、本タスクの AC は「UT-09 が参照可能な状態」までを担保する

## 次 Phase

- 次: Phase 2（設計：sync-method-comparison / sync-flow-diagrams / sync-log-schema）
- 引き継ぎ: AC-1〜AC-10 / 苦戦箇所 7 件 / Schema Ownership 宣言 / タスクタイプ確定値（docs-only / NON_VISUAL / spec_created）
