# Phase 7 — カバレッジ確認

## 1. 対象範囲

| 対象 | 期待カバレッジ |
|------|---------------|
| `apps/web/app/privacy/page.tsx` | Statements / Branches 100%（async + 単一 JSX return のため到達容易） |
| `apps/web/app/terms/page.tsx` | 同上 |

## 2. 確認コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  app/privacy/__tests__/page.spec.tsx \
  app/terms/__tests__/page.spec.tsx
```

`coverage` 出力で対象 2 file が 100% であることを目視確認。プロジェクト全体カバレッジ閾値は親ワークフロー / リポジトリ既定値に従う。

## 3. 未カバー許容範囲

- `getAuthView()` 内部分岐（guest/member/admin/fail-closed）は Task A の spec で別途カバー。本 Task では mock 経由で各 state を到達させるのみ。
- `PublicHeader` / `PublicFooter` 内部分岐は本 Task のカバレッジ対象外（既存 component spec で担保）。

## 4. 失敗時対応

到達不能行が出た場合:
- 不要な分岐があれば Phase 8 リファクタリングで削減
- mock 不足であれば Phase 6 に戻りケース追加

## 5. ゲート

- [ ] privacy/page.tsx coverage = 100%
- [ ] terms/page.tsx coverage = 100%
