# task-issue-274-followup-001-dynamic-member-og-image

## メタ情報
| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-274-followup-001-dynamic-member-og-image |
| 発見元 | `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/` Phase 12 |
| ステータス | 未実施 |
| 分類 | implementation / VISUAL |
| canonical parent | `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/` |
| GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/806 |

## 苦戦箇所【記入必須】
Root `opengraph-image.tsx` はサイト共通画像として十分だが、member detail を SNS 共有すると member 固有の名前や肩書きが画像に出ない。root SEO 実装と同じ cycle に含めると sitemap / robots / root metadata の小さな実装に member detail rendering と profile fetch の関心が混ざる。

## リスクと対策
| リスク | 対策 |
| --- | --- |
| member detail OG image が publicConsent=false の情報を漏らす | 既存 `/public/members/:id` contract の公開 profile のみを入力にする |
| root OG image と重複した styling が drift する | `site-metadata.ts` の SITE 定数と token color mapping を再利用する |

## 検証方法
- `pnpm --filter @ubm-hyogo/web typecheck`
- `/members/<id>/opengraph-image` の PNG response 確認
- Playwright または curl で member detail `og:image` が member-specific path を指すことを確認

## スコープ
含む:
- `/members/[id]/opengraph-image.tsx`
- member detail `generateMetadata` の image path 差し替え

含まない:
- sitemap / robots / root OG image
- API endpoint 追加

