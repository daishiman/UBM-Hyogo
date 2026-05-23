# Phase 11 — manual test result

## 証跡ソース

`manual-smoke-log.md` に実行コマンド、exit code、PASS summary を記録した。

## 実行記録

| 項目 | 値 |
| --- | --- |
| focused spec | `apps/api/src/services/aliasRecommendation.spec.ts` |
| focused result | 20 tests PASS |
| route contract | `apps/api/src/routes/admin/schema.contract.spec.ts` 16 tests PASS |
| wider regression | apps/api 48 files / 300 tests PASS |
| exit code | 0 |

## 仕様判断根拠

サービス層 pure function の変更のみで、UI / DOM / API response shape / DB schema は変わらないため NON_VISUAL evidence で完了する。

## 既知制限

- 大小文字統一はしない。
- カタカナ/ひらがな変換はしない。
- 記号除去、辞書、embedding は導入しない。
