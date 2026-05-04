# implementation-guide

## Part 1: 中学生レベル

このページは、お店の入口に貼ってある「この店で守る約束」のようなものです。見る人は、どんな情報を預けるのか、何をしてはいけないのか、困ったときはどこへ連絡するのかを先に知ることができます。

Google でログインする仕組みを使うには、Google にも「このサイトには約束のページがあります」と示す必要があります。そのため `/privacy` と `/terms` を作り、開いたらきちんと表示される状態にします。

| 用語 | 日常語の言い換え |
| --- | --- |
| Privacy Policy | 情報の扱い方を書いた約束 |
| Terms | サービスを使うときの約束 |
| metadata | ページの名札 |
| canonical URL | 正しい住所 |
| robots | 検索サービスへの案内 |
| deploy | インターネットに公開すること |

## Part 2: 技術者レベル

対象ファイル:

| File | Responsibility |
| --- | --- |
| `apps/web/app/privacy/page.tsx` | Privacy page Server Component + metadata |
| `apps/web/app/terms/page.tsx` | Terms page Server Component + metadata |
| `apps/web/app/privacy/__tests__/page.test.tsx` | Privacy semantic render and metadata test |
| `apps/web/app/terms/__tests__/page.test.tsx` | Terms semantic render and metadata test |

TypeScript contract:

```ts
import type { Metadata } from "next";

export const metadata: Metadata;
export default function PrivacyPage(): JSX.Element;
export default function TermsPage(): JSX.Element;
```

Validation commands:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- privacy terms
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web build
```

Local visual evidence:

| Page | Screenshot |
| --- | --- |
| `/privacy` | `../phase-11/screenshots/privacy-local.png` |
| `/terms` | `../phase-11/screenshots/terms-local.png` |

Error / edge handling:

| Case | Handling |
| --- | --- |
| #385 regression | build gate fails; do not deploy |
| staging / production non-200 | rollback runbook Phase 8 |
| legal final text unavailable | keep status `interim_oauth_url_ready_pending_final_legal_review` |
| Cloud Console access unavailable | keep OAuth evidence pending, do not mark final PASS |
