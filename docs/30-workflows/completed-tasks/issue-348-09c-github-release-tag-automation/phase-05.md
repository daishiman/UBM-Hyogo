# Phase 5: スクリプト実装

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-5/phase-5.md` |
| 実装区分 | 実装仕様書 |

## 目的
release tag (`vYYYYMMDD-HHMM`) から release note 本文を組み立てる `scripts/release/generate-release-notes.sh` と、tag 検証 → dry-run → apply の 3 段ゲートを担う `scripts/release/create-github-release.sh` の実装仕様を確定する。本 Phase はコード実装ではなく、関数シグネチャ・引数・stdin/stdout・exit code・エラー条件を仕様として書く。

## 実行タスク
詳細は `outputs/phase-5/phase-5.md` を正本とする。

## 統合テスト連携
Phase 4 設計の bats / shellcheck テストと整合し、Phase 10 の単体テスト実装で検証する。

## 参照資料
- `outputs/phase-5/phase-5.md`
- 既存 release tag 手順: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md`
- index: `docs/30-workflows/issue-348-09c-github-release-tag-automation/index.md`

## 成果物
- `outputs/phase-5/phase-5.md`
- `scripts/release/generate-release-notes.sh`（仕様確定。実装は Phase 13 まで保留）
- `scripts/release/create-github-release.sh`（仕様確定）

## 完了条件
- Phase 5 正本ファイルが存在する。
- 2 スクリプトの関数シグネチャ・引数・exit code・エラーハンドリングが仕様として記述されている。
- `set -euo pipefail` 準拠の前提が明記されている。
