# Phase 8: リファクタリング

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-8/phase-8.md` |

## 目的
backend-ci.yml と backend-ci.yml の重複を reusable workflow（`.github/workflows/deploy-shared.yml`）へ抽出可能か評価し、抽出する場合は実装する。抽出しない場合は理由を記録。

## 参照資料
- `outputs/phase-8/phase-8.md`

## 成果物
- `outputs/phase-8/refactor-decision.md`

## 完了条件
- 抽出 / 非抽出のいずれかの判断と根拠が記録され、IPC契約相当（workflow input/output 契約）の drift がない。

## 実行タスク
- [ ] reusable workflow 抽出が最小複雑性に反しないか評価する。

## 統合テスト連携
- 抽出しない場合は既存 Phase 5/9 の workflow static evidence を継続利用する。
