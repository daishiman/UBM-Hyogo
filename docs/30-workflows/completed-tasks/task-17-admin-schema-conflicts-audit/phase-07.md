# Phase 7: カバレッジ確認

[実装区分: 実装仕様書]

## 目的

変更行に対する coverage を可視化し、未網羅 branch を特定する。

## 対象範囲 (Feedback BEFORE-QUIT-002)

広域 % 目標ではなく、本 task で **patch した canonical path のみ** を対象とする:

- `apps/web/src/components/admin/SchemaDiffPanel.tsx`
- `apps/web/src/components/admin/IdentityConflictRow.tsx`
- `apps/web/src/components/admin/AuditLogPanel.tsx`
- `apps/web/src/lib/admin/api.ts`
- `apps/web/app/(admin)/admin/{schema,identity-conflicts,audit}/page.tsx`

## 目標

| 種別 | 目標 |
|------|------|
| Statements | 90% 以上 |
| Branches | 85% 以上 |
| Functions | 90% 以上 |
| Lines | 90% 以上 |

## 実行コマンド

```bash
mise exec -- pnpm -F @ubm-hyogo/web test --coverage --run \
  src/components/admin/__tests__/SchemaDiffPanel.test.tsx \
  src/components/admin/__tests__/AuditLogPanel.test.tsx \
  src/lib/admin/__tests__/api.test.ts \
  app/\\(admin\\)/admin/audit/page.test.ts
```

## 確認内容

- 各 fetch fn の error path が covered
- `SchemaDiffPanel` の 4 type (added/removed/changed/unresolved) すべての分岐が hit
- `actionTone()` の全 5 種 (`.delete/.create/.update/.view/その他`) が hit
- `groupByDate()` の同日複数 entry / 複数日 entry の両方が hit
- `IdentityConflictRow` の action (merge/dismiss) が hit

## 成果物

- `outputs/phase-07/coverage-report.md` — 上記 canonical path 範囲の coverage 数値 + 未網羅行リスト
- 未網羅 branch があれば Phase 6 へ戻して追加テスト

## DoD

- [ ] 対象範囲の coverage 数値が記録された
- [ ] 目標未達のラインがあれば Phase 6 補強済 (または許容理由を明記)
