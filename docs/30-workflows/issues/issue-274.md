# [#274] [06a-followup-002] public pages OGP / sitemap / metadata 整備

## メタ情報

```yaml
issue_number: 274
title: [06a-followup-002] public pages OGP / sitemap / metadata 整備
state: OPEN
priority: 中
scale: 中規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/274
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要
06a 公開導線 (`/`, `/members`, `/members/[id]`, `/register`) の SNS シェア用 metadata、OGP、sitemap、robots を整備する。

## 苦戦箇所（重要）
06a は公開導線の画面実装に集中し、SNS シェア用 metadata、OGP、sitemap はスコープ外として残った。公開ページとしては見つけやすさと共有時の説明品質が不足する。

## リスクと対策
- `/members/[id]` の個別ページ共有時に generic title しか出ない → member summary から title / description を生成
- sitemap 未整備で公開ページの発見性が落ちる → Next.js metadata route で static route + public member route を出す

## 検証方法
- `pnpm --filter @ubm-hyogo/web typecheck`
- `curl http://localhost:3000/sitemap.xml`
- `curl http://localhost:3000/robots.txt`
- Playwright で `<meta property="og:*">` を確認

## スコープ
含む: root metadata / OGP / Twitter card / sitemap / robots
含まない: OGP 画像生成 / 管理画面 metadata

## 参照
- タスク仕様書: `docs/30-workflows/unassigned-task/task-06a-followup-002-ogp-sitemap.md`
- 親タスク Phase-12 implementation-guide: `docs/30-workflows/06a-parallel-public-landing-directory-and-registration-pages/outputs/phase-12/implementation-guide.md`
- 発見元: 06a Phase 12 未タスク検出 (2026-04-29)
