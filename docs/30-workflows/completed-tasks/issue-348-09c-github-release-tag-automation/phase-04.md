# Phase 4: 統合テスト設計（bats / actionlint / shellcheck）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-4/phase-4.md` |

## 目的
bats（決定論性 / tag format invalid → exit 1 / changelog missing → fallback / dry-run と apply の差分）、`actionlint` による workflow 検証、`shellcheck` によるスクリプト検証、`gh release create --notes-file` の dry-run 相当（実 release は作成しない）方針を確定する。

## 実行タスク
詳細は `outputs/phase-4/phase-4.md` を正本とする。

## 統合テスト連携
- `bash scripts/release/__tests__/run-all.sh` で `generate-release-notes.sh` と `create-github-release.sh` の dry-run / apply mock 境界を検証する。
- `bats scripts/release/__tests__/generate-release-notes.bats` は bats 利用可能環境で同じ契約を検証する。
- `.github/workflows/release-create.yml` は `actionlint` 利用可能環境で検証する。
- `scripts/release/*.sh` は `shellcheck` 利用可能環境で検証する。

## 参照資料
- `outputs/phase-4/phase-4.md`
- `outputs/phase-3/phase-3.md`

## 成果物
- `outputs/phase-4/phase-4.md`

## 完了条件
- bats 4 シナリオ / actionlint / shellcheck / `gh release create` 非作成方針が網羅されている。
