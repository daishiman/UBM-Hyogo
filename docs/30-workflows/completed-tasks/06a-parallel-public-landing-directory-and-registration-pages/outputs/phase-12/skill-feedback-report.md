# skill-feedback-report.md

| 観点 | 内容 |
| --- | --- |
| 役立ったスキル | spec 駆動開発 / RSC + Cache-Control / zod `catch` による fallback / App Router の `searchParams` Promise 化対応 |
| 困難だった点 | density の用語統一（`comfortable/compact` 撤廃）、`apps/web/app/page.tsx` と `(public)/page.tsx` の競合回避（既存 page を上書き採用） |
| 次に活かす改善 | spec 用語辞書を `docs/00-getting-started-manual/glossary.md` (仮) に集約、`(public)` ルートグループ採用の判断を README に記載 |

## 学び

- Next.js 16 では `searchParams` / `params` が Promise になっている。`await` 必須。
- App Router の route group `(public)` はパスに含まれないため、`app/page.tsx` と `app/(public)/page.tsx` は同じルートを指して衝突する。本タスクでは既存 `app/page.tsx` を新コンテンツで上書きする選択を取った。
- zod の `catch` は input が enum に一致しない場合のみ動作するため、`q` のような string 加工には `transform` を併用するのが安全。
- 04a の `PublicMemberProfileZ` には `publicSections` のみが入っており、apps/web 側で追加 filter は不要（fail-close）。
