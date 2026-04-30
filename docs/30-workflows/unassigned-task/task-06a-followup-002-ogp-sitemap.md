## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-06a-followup-002-ogp-sitemap |
| タスク名 | public pages OGP / sitemap / metadata |
| 分類 | SEO / 公開導線品質 |
| 対象機能 | public web (`/`, `/members`, `/members/[id]`, `/register`) |
| 優先度 | 中 |
| ステータス | 未実施 |
| 発見元 | 06a Phase 12 未タスク検出 |
| 発見日 | 2026-04-29 |

---

## 苦戦箇所【記入必須】

06a は公開導線の画面実装に集中し、SNS シェア用 metadata、OGP、sitemap はスコープ外として残った。公開ページとしては見つけやすさと共有時の説明品質が不足する。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `/members/[id]` の個別ページ共有時に generic title しか出ない | member summary から title / description を生成する |
| sitemap 未整備で公開ページの発見性が落ちる | Next.js metadata route で static route + public member route を出す |

## 検証方法

- `pnpm --filter @ubm-hyogo/web typecheck`
- `curl http://localhost:3000/sitemap.xml`
- `curl http://localhost:3000/robots.txt`
- Playwright で `<meta property="og:*">` を確認

## スコープ（含む/含まない）

含む:
- root metadata
- OGP / Twitter card
- sitemap / robots

含まない:
- OGP 画像生成
- 管理画面 metadata
