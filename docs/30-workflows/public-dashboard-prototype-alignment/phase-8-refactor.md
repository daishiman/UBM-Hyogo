---
実装区分: 実装仕様書
状態: spec_created
Phase: 8
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [index.md](./index.md)
前: [phase-7-coverage.md](./phase-7-coverage.md)
次: [phase-9-qa.md](./phase-9-qa.md)
---

# Phase 8: リファクタ

## 1. 目的

Phase 5 実装着地後の重複 / drift を最小コストで解消する。新機能追加は禁止。

## 2. リファクタ候補

| # | 対象 | 内容 | 採用 |
| --- | --- | --- | --- |
| RF-1 | `Hero.tsx` の `variant="panel"` legacy path | 呼び出しが `app/page.tsx` のみ → 全置換完了後に削除可能だが、外部参照 grep で 0 件確認できるなら削除を採用 | 条件付き採用 (grep 確認後) |
| RF-2 | `ZoneIntro.tsx` の単独セクション | `app/page.tsx` から削除済。component ファイル自体は保持 | **保持** (Phase 3 §6 C4) |
| RF-3 | `Stats.tsx` の `MEETINGS_PER_YEAR=12` constant | 同 component 内 const のまま | 保持 (Phase 5 §4 採用済) |
| RF-4 | `Timeline.tsx` の `yyyyMm` / `dd` を `lib/format/date.ts` に切り出し | utility 集約 → 他箇所で再利用予定が無いため YAGNI | 採用しない |
| RF-5 | Featured wrapper の inline section を `FeaturedMembers.tsx` component 化 | 1 箇所のみで使用 → YAGNI | 採用しない |
| RF-6 | `legacy-public.css` の追加分が肥大化 → token 化 | 今回追加分は約 80 行で許容範囲 | 採用しない |

## 3. drift / 命名 / import 整理

| 観点 | 確認内容 | 対応 |
| --- | --- | --- |
| import 順 | `apps/web/app/page.tsx` の import が ESLint sort-imports 違反していないか | `pnpm lint --fix` で自動修正 |
| dead code | `ZoneIntro` を delete せず保持しているため `Knip` 等が unused 警告を出す可能性 | 既存方針に従い `// eslint-disable-next-line` / `// @keep` コメントを付けない (false positive を許容) |
| unused import | `app/page.tsx` で `ZoneIntro` import が残っていないか | 削除 (RF-2 と整合) |
| HEX 直書き | `verify-design-tokens` PASS 必須 | Phase 9 で確認 |

## 4. リファクタ後の確認

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run apps/web/src/components/public/__tests__/ apps/web/app/__tests__/page.spec.tsx
```

すべて exit 0 を確認。

## 5. DoD (Phase 8)

- [ ] §3 のチェック表が全 PASS
- [ ] §2 の RF-1 を条件付き採用した場合、関連 spec (TC-HERO-002) も削除済
- [ ] `ZoneIntro.tsx` は保持されている

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 8
- workflow_state: `spec_created`

## 目的

Phase 5 着地後の重複削減と命名 / import 整理を行う。

## 完了条件

- [ ] リファクタ後に typecheck / lint / 限定 test が全 PASS
