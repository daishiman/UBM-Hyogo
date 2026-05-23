# Phase 9: QA

## 1. 機能 QA チェックリスト

- [ ] `/members/<seeded>/opengraph-image` で 200 PNG が返る
- [ ] `/members/<seeded>` の HTML に member-specific `og:image` content が含まれる
- [ ] `/members/<nonexistent>/opengraph-image` で 404 が返る
- [ ] `/members/<seeded>` の page metadata の title / description は **既存通り**（regression なし）
- [ ] root `/opengraph-image` が壊れていない（200 PNG / 既存内容）
- [ ] `/`（top）と `/members`（list）の og:image は **root site image** のまま（regression なし）
- [ ] `/sitemap.xml` と `/robots.txt` が #274 の挙動から変わっていない（200 / env branch / degraded sitemap contract）

## 2. 非機能 QA

- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm --filter @ubm-hyogo/web build` PASS（`next build --webpack`）
- [ ] `apps/web/.open-next/` bundle に `[project]/...` 仮想 module specifier が混入していない（`grep -r "\\[project\\]" apps/web/.open-next | head` が空）
- [ ] coverage delta ≥ 0
- [ ] `bash scripts/verify-pr-ready.sh` PASS

## 3. セキュリティ QA

- [ ] `const { id } = await params` 後の `id` は `encodeURIComponent` 経由で fetch に渡される（path traversal / injection なし）
- [ ] publicConsent=false の member id をリクエストしたとき 404（API 経由でガード）
- [ ] OG 画像に email / phone / 連絡先 が描画されていない（fullName と occupation のみ）

## 4. レビュー観点

- [ ] root opengraph-image.tsx の HEX と一致する gradient を使用（drift なし）
- [ ] route-level `runtime = "edge"` が未指定
- [ ] テストは `*.spec.tsx` で配置（不変条件 #8）
