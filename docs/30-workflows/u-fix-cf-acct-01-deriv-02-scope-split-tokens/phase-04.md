# Phase 4: テスト作成

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-4/phase-4.md` |

## 目的
workflow YAML lint（`actionlint`）、`scripts/cf.sh` の Token 引数化に対する shell smoke test、Token scope 充足性検証手順を準備する。

## 参照資料
- `outputs/phase-4/phase-4.md`

## 成果物
- `outputs/phase-4/phase-4.md`
- `outputs/phase-4/test-plan.md`
- `scripts/__tests__/cf-token-arg.test.sh`（実装は Phase 5）

## 完了条件
- テスト計画と検証コマンドリストが確定。

## 実行タスク
- [ ] workflow static check、shell smoke、secret hygiene check のテスト仕様を固定する。

## 統合テスト連携
- `scripts/__tests__/cf-token-arg.test.sh` と YAML 構文検証を Phase 5/9 の実行コマンドへ接続する。
