# Phase 2: 設計 — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 2 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

Privacy / Terms ページの構造・metadata・SEO・Cloudflare Workers (OpenNext) との整合を設計する。

## ページ設計

### `/privacy` (PrivacyPage)

| 項目 | 値 |
| --- | --- |
| Route | `apps/web/app/privacy/page.tsx` |
| Component | `export default function PrivacyPage()` |
| Rendering | Static (Server Component, no data fetch, no client hooks) |
| Metadata | `export const metadata: Metadata = { title, description, alternates: { canonical: "/privacy" }, robots: { index: true, follow: true } }` |
| Required sections | 1.取得する情報 / 2.利用目的 / 3.第三者提供 / 4.管理 / 5.開示・訂正・削除 / 6.改定 / 連絡先 |

### `/terms` (TermsPage)

| 項目 | 値 |
| --- | --- |
| Route | `apps/web/app/terms/page.tsx` |
| Component | `export default function TermsPage()` |
| Rendering | Static (Server Component) |
| Metadata | `title, description, alternates.canonical: "/terms", robots: index/follow` |
| Required sections | 1.目的 / 2.利用資格 / 3.禁止事項 / 4.退会 / 5.免責事項 / 6.改定 / 連絡先 |

## Cloudflare Workers / OpenNext 設計上の制約

- **`useContext` 等の client-only hook を import しない**（#385 build 失敗の再発防止）。
- `next/headers` や `cookies()` は呼ばない（純静的）。
- `revalidate = false` 相当（標準 SSG / static export 経路）。
- `app/layout.tsx` の既存 Provider に依存しない構成にする（不要な `"use client"` boundary を作らない）。

## SEO / 法的記載

- `<html lang="ja">` 継承（layout 側）。
- 公開日 / 改定日 を本文末尾に明示（運用ルール: 改定都度更新）。
- 連絡先は Google Form 再回答 URL を案内（CLAUDE.md `7. MVP では Google Form 再回答を本人更新の正式な経路` に整合）。

## URL 設計

| 環境 | URL（確認用 placeholder, Phase 11 で実 URL に置換） |
| --- | --- |
| staging | `https://<staging-host>/privacy`, `/terms` |
| production | `https://<production-host>/privacy`, `/terms` |

## 完了条件

- [ ] ページ構造・metadata 設計が固定されている
- [ ] Workers/OpenNext 制約（client hook 禁止）が明文化されている
- [ ] `outputs/phase-02/main.md` を作成する
