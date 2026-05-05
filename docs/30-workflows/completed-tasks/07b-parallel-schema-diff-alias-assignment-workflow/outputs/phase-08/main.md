# Phase 8: DRY 化

## 共通化対象の抽出

| 項目 | 既存 helper | 新規追加 | 判定 |
|------|------------|---------|------|
| audit_log 記録 | `repository/auditLog.append` | 既存利用のみ | DRY OK |
| stableKey UPDATE | `repository/schemaQuestions.updateStableKey` | 既存利用 | DRY OK |
| diff resolve | `repository/schemaDiffQueue.resolve` | 既存利用 | DRY OK |
| Levenshtein | なし | `services/aliasRecommendation.ts` | 新規（再利用想定: 将来 tag alias 推奨等） |

## 結論

ロジックは workflow と service に分離済み。重複や inline 化はなし。
