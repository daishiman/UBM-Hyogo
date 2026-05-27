# issue-275-magic-link-429-retry-after

> Source issue: [#275](https://github.com/daishiman/UBM-Hyogo/issues/275)（OPEN のまま仕様書化・PR 本文では `Refs #275` を使用し Issue 状態は変更しない）
> Parent workflow: `docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/`（login / magic-link 周り親仕様）
> 実装区分: **実装完了仕様書**（コード変更・テスト追加・正本同期を同一サイクルで実施）
> 状態: `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval`
> 作成日: 2026-05-26

## 調査サマリ（実装前後の差分）

| 項目 | 現状 | 判定 |
|---|---|---|
| API `POST /api/auth/magic-link` の 429 応答 | `apps/api/src/middleware/rate-limit-magic-link.ts` + `apps/api/src/middleware/edge-rate-limit-headers.ts` が `Retry-After` ヘッダー / body `{ retryAfterSec, reason }` を返却済み | ✓ 実装済み |
| Web client `sendMagicLink` の 429 解釈 | `apps/web/src/lib/auth/magic-link-client.ts` は `MagicLinkRateLimitedError` を追加し、`Retry-After` header → body `retryAfterSec` → default 60 の順で `retryAfterSec` を解決する | ✓ 実装済み |
| `MagicLinkForm` の 429 受信時挙動 | `apps/web/app/login/_components/MagicLinkForm.client.tsx` は typed rate-limit error を catch し、`replaceLoginState("error")` へ遷移せず `setCooldown(retryAfterSec)` で server-truth countdown を開始する | ✓ 実装済み |

**結論**: Issue #275 の AC（typed error / server-truth countdown / Vitest 検証）は本サイクルで実装済み。Issue 状態は `OPEN` のまま変更しない（commit / push / PR / Issue mutation は user-gated）。

## 概要

`POST /api/auth/magic-link` が `HTTP 429` を返したとき、Web 側を次の 2 段で server-truth に整合させる:

1. **`apps/web/src/lib/auth/magic-link-client.ts`**: 429 を `MagicLinkRateLimitedError extends MagicLinkRequestError` として throw し、`retryAfterSec` を保持する。`Retry-After` ヘッダーを最優先、無ければ JSON body `retryAfterSec`、両方欠落時は default `60` 秒を採用する。
2. **`apps/web/app/login/_components/MagicLinkForm.client.tsx`**: catch ブロックで rate-limit typed error を判別し、`error` state ではなく `setCooldown(retryAfterSec)` で server-truth countdown を起動する。URL state は `sent` ではなく `input` を維持（mail 未送信のため）。cooldown のみが切り替わる。

reload 後の永続化はスコープ外（session 内復元のみ）。

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト追加 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ（本タスクではなし） |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | NON_VISUAL local evidence |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（概念説明含む） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（Refs #275） |

## 変更対象ファイル

- `apps/web/src/lib/auth/magic-link-client.ts`（**修正済み**：`MagicLinkRateLimitedError` 追加 / 429 分岐で header → body → default の優先順位で `retryAfterSec` を解析）
- `apps/web/src/lib/auth/magic-link-client.spec.ts`（**修正済み**：429 + `Retry-After` ヘッダー / 429 + body `retryAfterSec` / 429 + invalid header/body / 429 + invalid JSON の 4 ケース追加）
- `apps/web/app/login/_components/MagicLinkForm.client.tsx`（**修正済み**：catch で `MagicLinkRateLimitedError` を判別し `setCooldown(retryAfterSec)` を呼ぶ。URL state は `input` を維持）
- `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx`（**修正済み**：429 受信時 button disabled + countdown 表示 / 既存 200 OK regression 追加検証）
- `.claude/skills/aiworkflow-requirements/indexes/{resource-map.md,quick-reference.md}`（**同期済み**）
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（**同期済み**）
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-275-magic-link-429-retry-after-artifact-inventory.md`（**新規**）
- `docs/30-workflows/unassigned-task/UT-06B-MAGIC-LINK-RETRY-AFTER.md`（**consumed pointer 新規**）

## スコープ外（本仕様内では新規バックログ化しない）

- reload を跨いだ cooldown 永続化（localStorage / cookie 化）。AC 明記の除外項目
- API 側の rate limit 仕様変更（既に server-truth として `Retry-After` + body を返却している）
- マルチタブ間 cooldown 同期（BroadcastChannel 等）
- IP / email キーの粒度変更や reset 経路追加

## 不変条件

1. CLAUDE.md 不変条件 #5（`apps/web` から D1 直接アクセス禁止）を維持（本変更は client-only / API 経由）
2. CLAUDE.md 不変条件 #9（admin mutation hook 統一）に抵触しない（本変更は admin 配下外）
3. URL state は `sent` を勝手に立てない。429 時は **mail 未送信**であるため `input` を維持する（プライバシ・UX 整合）
4. `Retry-After` 値が非数 / 負値 / NaN の場合は default 60 にフォールバックし、`MagicLinkRateLimitedError` 自体は throw する
5. `apps/web` ランタイムでの env 参照は env.ts の公開アクセサ経由のみ（本変更では env 参照を増やさない）
