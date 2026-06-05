# Phase 7: カバレッジ確認

本タスクは小規模 UX 改善のため、カバレッジ計測対象を **本タスクの変更行に限定** する。リポジトリ全体の coverage 閾値達成は本タスクのスコープ外（既存 coverage-guard の `--changed` モードに委ねる）。

---

## 7.1 計測対象（変更行に限定）

| ファイル | 対象範囲 |
|----------|----------|
| `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | (a) `tagLabelById` 派生 useMemo、(b) skipped 行の `membersById?.[r.memberId]?.fullName ?? r.memberId`、(c) notFound 行の `label ? label : `${r.tagId}（未登録）`` |
| `apps/web/src/features/admin/components/_members/MembersClientShell.tsx` | `membersById` 構築 useMemo（`Object.fromEntries(initial.members.map(...))`） |

---

## 7.2 目標と検証ケース対応

| 変更行 | line/branch 目標 | 検証ケース |
|--------|------------------|------------|
| skipped 行: `fullName` 解決パス | 100% | TC-BAB-TAG-06 |
| skipped 行: `?? r.memberId` fallback パス | 100% | TC-BAB-TAG-07 |
| notFound 行: `label` 解決パス | 100% | TC-BAB-TAG-07 |
| notFound 行: `{tagId}（未登録）` fallback パス | 100% | TC-BAB-TAG-07 |
| `tagLabelById` useMemo 構築 | 100% | TC-BAB-TAG-07（available から label 解決を経由） |
| `MembersClientShell` の `membersById` useMemo | 描画到達で 100% | 既存 MembersClientShell の render テストがあれば自動到達。無い場合は本変更が純粋派生のため Phase 5 の DoD（typecheck）で型整合のみ担保し、ランタイム到達は `/admin/members` の E2E/手動（Phase 11）で確認 |

> `MembersClientShell` の `membersById` は単純な派生で分岐を持たない（`Object.fromEntries(map)` のみ）。専用ユニットテストの新設は過剰のため行わず、BulkActionBar 側の prop 注入テストで表示解決の振る舞いを担保する。

---

## 7.3 計測方針

- focused component test の実測は Phase 11 に記録済み（12 tests PASS）。
- 計測コマンド例（実装サイクル）:
  `mise exec -- pnpm --filter @ubm-hyogo/web test --run --coverage src/features/admin/components/__tests__/BulkActionBar.spec.tsx`
- 変更した分岐（fullName 解決 / memberId fallback / tag label 解決 / `（未登録）` fallback）の 4 分岐がすべてテストで踏まれていることを確認する。未踏分岐があれば Phase 6 のケースを追加する。
