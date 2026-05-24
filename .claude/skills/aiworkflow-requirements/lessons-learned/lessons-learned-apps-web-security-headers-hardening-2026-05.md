# Lessons Learned — apps/web response security headers hardening（2026-05-23）

> 親 workflow: `docs/30-workflows/apps-web-security-headers-hardening/`
> 関連 reference: [`security-web-response-headers.md`](../references/security-web-response-headers.md), [`deployment-cloudflare-opennext-workers.md`](../references/deployment-cloudflare-opennext-workers.md), [`workflow-apps-web-security-headers-hardening-artifact-inventory.md`](../references/workflow-apps-web-security-headers-hardening-artifact-inventory.md)
> ステータス: `implemented_local_evidence_captured / implementation / NON_VISUAL`

## 背景

`apps/web` の全 route response に CSP / Referrer-Policy / X-Content-Type-Options / Permissions-Policy 等の security headers を inject する hardening。`apps/web/src/lib/security-headers.ts` を SSOT とし、`apps/web/middleware.ts` で `applySecurityHeaders()` を呼ぶ middleware injection 方式を採用した。OpenNext Workers build / Next.js 16 App Router / Cloudflare Workers 境界の互換性を保ったまま、CSP は段階的 rollout のため initial `Content-Security-Policy-Report-Only` で固定。実装中に CSP enforce 段階化、Permissions-Policy の browser 互換性、Trusted Types の Next.js 互換性、env canonical drift の 4 つの構造的な学びが抽出された。

## Lessons

### L-AWSHH-001: CSP は `Content-Security-Policy-Report-Only` で開始し、enforce 切替は user-gated follow-up に分離する

- **Why（中学生向け）**: いきなり「このページではこの通信先しか使えません」と厳しく止めてしまうと、本物の利用者が予期せず画面を見られなくなる可能性がある。まずは「ルール違反があったら教えてだけほしい」モードで観測してから本気の取り締まりに切り替える。
- **How to apply**:
  - 新規 surface に CSP を導入する際は initial header を **`Content-Security-Policy-Report-Only`** で固定する。`Content-Security-Policy`（enforce）は staging / production の report 観測結果が揃ってからの user-gated follow-up（本 workflow では `U-AWSHH-001`）として `unassigned-task-detection.md` に記録する。
  - SSOT `apps/web/src/lib/security-headers.ts` は header 名そのものを定数化し、enforce 切替時は header 名と policy 文字列をワンセットで差し替える契約にする（policy だけ切り替えると header 名 drift が出る）。
  - Phase 1 / Phase 5 で「enforce 化は同 wave で実施しない」旨を design / implementation plan に明記し、scope creep を防ぐ。
- 適用先 spec: `task-specification-creator` skill の security workflow テンプレ（initial mode を report-only に固定する mode value 候補）。

### L-AWSHH-002: `Permissions-Policy` の `browsing-topics` 等は **列挙しない** ことが互換性正解

- **Why（中学生向け）**: 「この機能はオフ」と書きたいが、その機能名をブラウザがまだ知らない場合、書くこと自体が syntax warning や parse error を引き起こすことがある。知らない名前を書かないのが一番安全。
- **How to apply**:
  - Privacy-sensitive feature の disable は `feature=()` 形式で列挙するが、Chrome 限定の experimental directive（例: `browsing-topics`）は **policy 文字列から完全に除外する**。spec で disable したい意図は reference (`security-web-response-headers.md`) に文書化する。
  - 同様に `require-trusted-types-for` / `trusted-types` も Next.js 16 SSR / RSC inline script との互換性が確認できるまで出力しない。CSP nonce 化（`U-AWSHH-002`）と一緒に rollout する。
  - Phase 6 unit test (`apps/web/src/lib/security-headers.spec.ts`) で「列挙されていない directive 名」を `expect(...).not.toContain('browsing-topics')` で **negative assertion** として固定し、将来の安易な追加を CI で block する。
- 適用先 spec: 上記 reference の `Permissions-Policy` 節および本 lesson。

### L-AWSHH-003: Header SSOT は `apps/web/src/lib/` に置き、`middleware.ts` は injection 境界に徹する

- **Why**: header 生成ロジックを `middleware.ts` に直書きすると、unit test で Workers / Edge runtime を毎回起動する必要が出てしまい、focused Vitest で軽量に検証できない。
- **How to apply**:
  - **Pure function** `applySecurityHeaders(response: Response): Response` を `apps/web/src/lib/security-headers.ts` に置き、Response/Headers のみを依存にする（`process.env` / `next/server` 等を import しない）。
  - `middleware.ts` は `NextResponse.next()` 直後に `applySecurityHeaders(res)` を 1 行で呼ぶだけにする。route matcher は middleware 側に閉じる。
  - Playwright smoke (`apps/web/playwright/tests/security-headers.spec.ts`) は HTTP response の実値で header 存在を確認し、unit と layer を分ける（unit = 文字列生成、playwright = injection 経路）。
  - 同じ pattern は `apps/api`（Hono）でも適用可能（`U-AWSHH-004`）。Hono の `c.res.headers.set()` を SSOT 関数経由にする契約をテンプレ化する。
- 適用先 reference: `deployment-cloudflare-opennext-workers.md` の middleware injection 境界節（追記済）。

### L-AWSHH-004: env canonical drift（`NEXT_PUBLIC_API_ORIGIN`）は Phase 1 baseline grep で early detect する

- **Why（中学生向け）**: 同じ「API の場所」を表す変数の名前を、設計書では古い名前のまま書いていると、実装が新しい名前を使った瞬間に「設計と実装でズレている」状態になる。設計書を書く最初の段階で、いまコードがどの名前を使っているかを grep で確かめておけば、ずっと前に気づける。
- **How to apply**:
  - Phase 1（要件） / Phase 2（設計）で env 名を仕様に書く前に **必ず baseline grep** を実行: `rg -n 'NEXT_PUBLIC_API_(ORIGIN|BASE_URL)' apps/web/src/lib/env.ts apps/web/wrangler.toml apps/web/.dev.vars.example`。`getPublicEnv()` の zod schema が canonical な env 名の正本。
  - 本 workflow では旧名 `NEXT_PUBLIC_API_ORIGIN` が一部 design 文書に残っており、Phase 1 grep で `NEXT_PUBLIC_API_BASE_URL` に補正した。SSOT は `apps/web/src/lib/env.ts` の zod schema である。
  - `security-headers.ts` の CSP `connect-src` 等で API origin を埋め込む場合は `getPublicEnv().NEXT_PUBLIC_API_BASE_URL` 経由のみを許可し、`process.env.*` の直接参照を禁止（`apps/web` env access 不変条件に整合）。
  - Phase 6 grep guard で `rg -n "127\\.0\\.0\\.1:8888|NEXT_PUBLIC_API_ORIGIN" apps/web/src apps/web/middleware.ts -g '!*.spec.ts' -g '!**/__tests__/**'` の 0 hit を維持する。
- 適用先 spec: `task-specification-creator` Phase 1 baseline grep の必須項目に `env canonical name drift` を追加。

## Cross-cuttings

- 本 4 件はいずれも **`implementation_mode: new` / `taskType: implementation` / `visualEvidence: NON_VISUAL`** のセキュリティ系 workflow に汎用適用可能。`apps/api` 側 hardening (`U-AWSHH-004`) では L-AWSHH-002（列挙しない directive）と L-AWSHH-003（SSOT 分離）を再利用する想定。
- Phase 12 strict 7 と CI gate `verify-phase12-compliance` の関係上、`phase12-task-spec-compliance-check.md` の「Phase 11 evidence file inventory」テーブルでは **workflow root 配下の path のみ** を `present` で記載し、`apps/web/**` 等 root 外の test/source file は同テーブルに含めない（含めると parser の存在検査が必ず fail する）。これは security workflow 固有ではない一般則だが、本 workflow で実際に踏んだので併記する。
