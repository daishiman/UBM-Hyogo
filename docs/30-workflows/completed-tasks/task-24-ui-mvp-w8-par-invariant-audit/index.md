# task-24-ui-mvp-w8-par-invariant-audit

**実装区分**: 実装仕様書（read-only audit; 成果物は `outputs/phase-5/audit-runner.sh`（新規 shell script）+ `INVARIANT-AUDIT.md`（22×6 matrix レポート）+ evidence ファイル群。`apps/` / `packages/` の既存コード変更は禁止＝`git diff apps/ packages/` 空を DoD で担保）。

## メタ情報

| 項目 | 値 |
|------|----|
| タスクID | task-24-ui-mvp-w8-par-invariant-audit |
| Wave | W8 par |
| 並列実行 | task-23 / task-25 / task-26 と並列可 |
| タスク種別 | NON_VISUAL / 監査タスク (audit-task) |
| visualEvidence | NON_VISUAL |
| implementation_mode | `verify_existing` (read-only 監査) |
| 上流依存 | task-01〜task-22（全完了済み・監査対象） |
| 下流依存 | task-27（本監査結果を参照） |
| ステータス | implemented_local_runtime_pending |

## 目的

UI prototype alignment / MVP recovery ワークフローで定義された **不変条件 6 項目** を、全 22 タスク（task-01〜22）の成果物と実装が遵守しているかを read-only で監査し、`22 task × 6 invariant` の matrix レポートを作成する。

## 監査対象の不変条件 6 項目

| ID | 不変条件 | 出典 |
|----|---------|-----|
| INV-1 | 既存 API endpoint のみ利用（新 endpoint 追加・D1 schema 変更禁止） | CLAUDE.md / SCOPE.md |
| INV-2 | OKLch トークン正本化（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止） | CLAUDE.md / task-08 / task-09 / task-18 |
| INV-3 | プロトタイプ正本順位（既存 primitives を超えた新規 primitive 禁止） | CLAUDE.md / claude-design-prototype |
| INV-4 | D1 直接アクセス禁止（apps/web から D1 binding 禁止） | CLAUDE.md |
| INV-5 | consent キー統一 (`publicConsent` / `rulesConsent`) | CLAUDE.md |
| INV-6 | GAS prototype は本番昇格禁止 | CLAUDE.md |

## 最終成果物

`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md`
（22 task × 6 invariant の matrix + evidence + 違反箇所一覧）

## Phase 表

| Phase | 名称 | ステータス | 成果物 |
|-------|------|-----------|--------|
| 1 | 要件定義 | completed | `phase-1.md` |
| 2 | 設計 | completed | `phase-2.md` |
| 3 | 設計レビュー | completed | `phase-3.md` |
| 4 | 監査スクリプト設計 | completed | `phase-4.md` |
| 5 | 監査実行（実装） | completed | `phase-5.md` |
| 6 | 追加 grep / 回帰 guard | completed | `phase-6.md` |
| 7 | カバレッジ（監査網羅率） | completed | `phase-7.md` |
| 8 | リファクタリング | completed | `phase-8.md` |
| 9 | 品質保証 | completed | `phase-9.md` |
| 10 | 最終レビュー | completed | `phase-10.md` |
| 11 | 手動テスト（NON_VISUAL） | completed | `phase-11.md` |
| 12 | ドキュメント更新 | completed | `phase-12.md` |
| 13 | PR作成 | spec_created（user 明示承認後実行） | `phase-13.md` |

## 不変条件（監査仕様自体の品質基準）

1. 監査結果は `22 task × 6 invariant` の matrix 形式で出力
2. 各セル: `COMPLIANT` / `VIOLATION` / `N/A`、`VIOLATION` は該当ファイル:行を引用
3. grep gate コマンド（`bg-[#`, `text-[#`, `#[0-9a-fA-F]{6}`）の実行結果を evidence として保存
4. 既存実装の書き換えはしない（read-only 監査）
