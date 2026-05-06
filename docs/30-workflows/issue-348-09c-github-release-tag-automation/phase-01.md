# Phase 1: 要件定義 / GO 判定 / tag format SSOT 確定

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-1/phase-1.md` |

## 目的
release tag format (`vYYYYMMDD-HHMM`) を SSOT として確定し、target commit 検証ルール / release note に含めるリンク種別（Phase 12 changelog / Phase 11 evidence / rollback evidence / known follow-up）を定義し、Phase 2 着手の GO/NO-GO を判定する。

## 実行タスク
詳細は `outputs/phase-1/phase-1.md` を正本とする。

## 統合テスト連携
Phase 4 の bats シナリオで tag format invalid → exit 1 を検証。

## 参照資料
- `outputs/phase-1/phase-1.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md`

## 成果物
- `outputs/phase-1/phase-1.md`

## 完了条件
- tag format `vYYYYMMDD-HHMM` が SSOT として確定し、release note の必須リンク種別 4 種が列挙されている。
