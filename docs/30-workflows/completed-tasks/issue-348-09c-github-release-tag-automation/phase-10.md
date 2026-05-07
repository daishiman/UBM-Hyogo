# Phase 10: 単体テスト実装仕様

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-10/phase-10.md` |

## 目的
release-note 生成スクリプト・workflow yaml・shell スクリプトの単体テスト / lint を実装し、tag format 検証 / changelog fallback / dry-run 決定論性 / actionlint clean / shellcheck clean を保証する。

## 実行タスク
詳細は `outputs/phase-10/phase-10.md` を正本とする。

## 統合テスト連携
本 Phase の bats / actionlint / shellcheck PASS を Phase 11 runtime evidence 取得の前提とする。

## 参照資料
- `outputs/phase-10/phase-10.md`
- `scripts/release/__tests__/generate-release-notes.bats`
- `.github/workflows/release-create.yml`

## 成果物
- `outputs/phase-10/phase-10.md`

## 完了条件
- bats / actionlint / shellcheck がすべて exit 0 で完了する仕様が記述済。
