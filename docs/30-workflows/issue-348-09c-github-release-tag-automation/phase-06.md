# Phase 6: template 実装

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-6/phase-6.md` |
| 実装区分 | 実装仕様書 |

## 目的
release note の placeholder テンプレ `scripts/release/release-notes.template.md` の各セクション構造、placeholder 命名規則、changelog 不在時のフォールバック表記を仕様化する。

## 実行タスク
詳細は `outputs/phase-6/phase-6.md` を正本とする。

## 統合テスト連携
Phase 5 の `generate-release-notes.sh` が template を読み、placeholder を sed/awk で決定論的に置換することを Phase 10 の bats で検証する。

## 参照資料
- `outputs/phase-6/phase-6.md`
- 09c Phase 12 changelog: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md`

## 成果物
- `outputs/phase-6/phase-6.md`
- `scripts/release/release-notes.template.md`（仕様確定）

## 完了条件
- Phase 6 正本ファイルが存在する。
- 7 セクション (Summary / Tag & Commit / Phase 12 Changelog / Phase 11 Runtime Evidence / Rollback Evidence / Known Follow-up / Refs) の構造が確定している。
- placeholder 命名規則 (`{{TAG}}` / `{{COMMIT}}` 等) が仕様として確定している。
- changelog 不在時の fallback 文言が確定している。
