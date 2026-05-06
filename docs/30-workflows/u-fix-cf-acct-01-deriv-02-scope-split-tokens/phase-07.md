# Phase 7: テストカバレッジ確認

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-7/phase-7.md` |

## 目的
本タスクは CI/CD workflow + docs 変更のみでアプリケーションコード非対象のため coverage AC は適用外。代替として `actionlint` clean / `pnpm lint` clean / `whoami` exit 0 の3点で品質を担保する。

## 参照資料
- `outputs/phase-7/phase-7.md`

## 成果物
- `outputs/phase-7/coverage-na-rationale.md`

## 完了条件
- coverage 適用外の根拠が記録され、代替検証3点が PASS。

## 実行タスク
- [ ] coverage 対象外の根拠と代替検証を記録する。

## 統合テスト連携
- アプリ統合テストは対象外。workflow/script/static evidence を代替として扱う。
