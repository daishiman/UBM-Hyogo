# task-11 public OG image / sitemap / robots - タスク指示書

## メタ情報

| 項目         | 内容                                                                 |
| ------------ | -------------------------------------------------------------------- |
| タスクID     | task-11-followup-002-public-og-sitemap-robots                        |
| タスク名     | 公開ページに OG image / sitemap.xml / robots.txt を追加              |
| 分類         | SEO / SNS 共有 / 公開導線品質                                        |
| 対象機能     | `apps/web/app/(public)` (`/`, `/members`, `/members/[id]`)           |
| 優先度       | 中                                                                   |
| 見積もり規模 | 小規模                                                               |
| ステータス   | consumed                                                             |
| canonical_workflow | `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/` |
| 発見元       | task-11-public-top-and-member-list / Phase 12 main.md                |
| 発見日       | 2026-05-09                                                           |

---

## 1. なぜこのタスクが必要か（Why）

> 2026-05-17: 本タスクは `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/` に統合済み。物理ファイルは source trace として残す。

### 1.1 背景

task-11 で公開 top と members 一覧の UI / API adapter を実装したが、SEO/SNS 共有のための metadata（OG image、sitemap、robots）はスコープ外として残された。task-06a-followup-002-ogp-sitemap で類似の指摘が既出だが、task-11 で hero / stats / timeline / members 一覧という具体的な公開導線が確定したため、metadata を実装するタイミングが整った。

### 1.2 問題点・課題

- `/` および `/members` を Slack / X 等で共有しても generic title / description しか出ない
- 検索エンジンが公開ページの構造を発見しづらい（sitemap なし）
- robots.txt が無く、staging が誤って index される可能性

### 1.3 放置した場合の影響

- 公開時の SNS 共有体験が弱く、団体の認知獲得効率が低下
- staging の noindex 制御が web/wrangler.toml 側 env 依存だけになり、漏れリスクが残る

---

## 2. 何を達成するか（What）

### 2.1 目的

Next.js App Router の metadata route と `opengraph-image` 規約に従い、最低限の OG image / sitemap / robots を整備する。

### 2.2 最終ゴール

- `/` と `/members` で `<meta property="og:*">` / `<meta name="twitter:*">` が出力される
- `/sitemap.xml` が静的 + 公開 member 一覧（task-11-followup-001 完了後）を返す
- `/robots.txt` が staging では `Disallow: /`、production では public ルートを許可

### 2.3 スコープ

#### 含むもの

- `apps/web/app/opengraph-image.tsx`（root, members 用）
- `apps/web/app/sitemap.ts`
- `apps/web/app/robots.ts`
- root layout の `metadata` export 整備

#### 含まないもの

- 個別 `/members/[id]` の動的 OG image 生成（別 followup）
- 管理画面の metadata
- 多言語 metadata
- Twitter / OGP の画像 CDN 化

### 2.4 成果物

- `apps/web/app/opengraph-image.tsx`（または route 別）
- `apps/web/app/sitemap.ts`
- `apps/web/app/robots.ts`
- `apps/web/app/(public)/layout.tsx` の metadata 拡張（実装時に現行 layout 構造を確認）

---

## 3. 検証方法

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web dev
curl -s http://localhost:3000/sitemap.xml | head
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/ | grep -E 'og:(title|description|image)'
```

Playwright で `/` と `/members` の `<meta>` を assert する smoke を追加。

---

## 4. リスクと対策

| リスク                                                  | 対策                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------- |
| OG image 生成が Workers の制約 (edge runtime) で失敗    | `next/og` の ImageResponse を edge runtime 前提で記述、build 確認   |
| staging で noindex を入れ忘れる                         | `robots.ts` で `process.env` ではなく `getEnv()` を使い env で分岐  |
| sitemap に publicConsent=false の member が混入         | API adapter 側で `publicConsent=true` のみ返す不変条件を再利用     |

---

## 5. 苦戦箇所メモ（再発防止）

- task-06a の同種 followup は `/register` まで対象だったが未着手のまま task-11 で公開導線が完成。SEO metadata は単体タスクとして実装容易だが、route 追加のたびに sitemap 更新が必要なので、route 追加 PR template に sitemap 確認項目を追加すべき。

---

## 6. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12/main.md`
- `docs/30-workflows/unassigned-task/task-06a-followup-002-ogp-sitemap.md`（先行類題）
- Next.js metadata files: `opengraph-image`, `sitemap`, `robots`

### 関連 task

- task-11-public-top-and-member-list（親 workflow）
- task-06a-followup-002-ogp-sitemap（先行・統合検討）
- task-11-followup-001-member-identities-local-seed（sitemap の動的部分の前提）
