# Phase 6: テスト拡充

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-6/phase-6.md` |

## 目的
staging で 6 Token のうち staging 3 Token を実投入し、deploy dry-run と `whoami` で scope 充足を確認する。

## 参照資料
- `outputs/phase-6/phase-6.md`

## 成果物
- `outputs/phase-6/staging-dry-run.log`
- `outputs/phase-6/staging-whoami-per-token.log`

## 完了条件
- staging 3 Token それぞれで `whoami` exit 0、deploy dry-run が必要 scope だけで完走。

## 実行タスク
- [ ] staging の D1 / Workers / Pages token runtime evidence 取得手順を定義する。

## 統合テスト連携
- Runtime evidence は user operation pending。local cycle では shell smoke と static YAML parse を代替 evidence とする。
