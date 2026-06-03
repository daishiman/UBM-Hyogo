# Phase 13: PR 作成

## 目的

ユーザー承認後に PR を `dev` 宛に作成する。本 wave は `implemented_local_evidence_captured` であり、実装・local focused Vitest・root typecheck・root lint・static UI contract screenshot は完了済み。staging runtime screenshot・commit・push・PR は user-gated（CONST_002）。本 Phase は PR 作成の多段ゲートと PR 構成を仕様として確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| state | pending_user_approval |
| workflow_state | implemented_local_evidence_captured |

## 多段ゲート（VISUAL_ON_EXECUTION の段階承認）

| Gate | 内容 | 承認方法 |
| --- | --- | --- |
| G1 | spec 完了（Phase 1〜12 + 3 タスク仕様 + strict 7） | ユーザー明示 OK |
| G2 | 実装 + local 検証（typecheck / lint / focused Vitest: api trailing-slash・me-route-mount integration・web proxy・profile page・SectionError）PASS | ユーザー明示 OK |
| G3 | staging deploy + `/profile` リロードの session-404 banner（再ログイン CTA）screenshot 取得（認証必須・user-gated） | ユーザー明示 OK |
| G4 | commit / push / PR open 承認 | ユーザー明示 OK |

各 Gate を独立に承認させる。合算承認は禁止。G3 は staging 認証セッションが必要なため user-gated（Claude Code は取得しない）。

## PR 構成

| 項目 | 値 |
| --- | --- |
| Title | `fix(profile,api,web): resolve /profile reload GET /me 404 via trailing-slash normalization, proxy fix, and re-login CTA` |
| Base | `dev` |
| Head | `docs/profile-reload-session-404-fix-spec` |

### PR 本文（テンプレ）

```md
## Summary

- T01 (apps/api): add a全-route trailing-slash normalizer middleware (`trailing-slash.ts`, 308 redirect) so `GET /me/` resolves like `GET /me` instead of hitting `notFoundHandler` (404). Add a full-app mount integration test (`me-route-mount.integration.spec.ts`) that asserts `GET /me` / `GET /me/` (unauthenticated) return 401, not 404.
- T02 (apps/web proxy): fix `/api/me/[...path]` so an empty path builds upstream `/me` (no trailing slash) instead of `/me/`. `/api/me/visibility-request` etc. remain unchanged.
- T03 (apps/web UI): branch `/profile` on `MEMBER_SESSION_404` to show a re-login CTA error (`/login?redirect=/profile`) instead of the raw `fetchAuthed failed: 404` string; non-404 non-2xx shows a fixed generic message + retry. Extend `SectionError` with optional `actionHref` / `actionLabel` props.

## Why

`GET /me` の正常系には 404 分岐が無い（`sessionGuard` は 401/410、ハンドラは 200）。404 は Hono の `app.route("/me", sub)` + `sub.get("/")` で `GET /me/`（末尾スラッシュ）が `notFoundHandler` に落ちることに由来する。web proxy が空 path 時に `${api}/me/` を生成する派生欠陥も再現を助長していた。`/profile` の Server Component はこの 404 を生 message のまま `SectionError` に表示していた。本 PR は根本（ルート解決層の末尾スラッシュ許容）・派生（proxy URL 構築）・表示（防御的 UX）を同一サイクルで閉じる。`/me` のレスポンス shape・path・D1 schema・Google Form 仕様は不変。

## Test plan

- [x] `pnpm typecheck` exit 0
- [x] `pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run src/middleware/__tests__/trailing-slash.spec.ts src/__tests__/me-route-mount.integration.spec.ts` PASS (completed local)
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run 'app/api/me/[...path]/route.route.spec.ts' 'app/(member)/profile/page.spec.tsx' src/components/member/__tests__/SectionError.spec.tsx` PASS (completed local)
- [ ] staging `/profile` reload: re-login CTA banner screenshot captured (pending G3, auth-required user-gated)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> 本ワークフローは独立 issue 番号を持たないため、PR 本文に issue リンクは付けない。

## blocked 条件

- G1〜G3 のいずれかが未承認 → Phase 13 blocked
- focused Vitest または typecheck/lint fail → Phase 8（リファクタリング）/ Phase 1（要件）へ戻る

## 完了条件

- [ ] G1〜G4 すべてユーザー承認済み（user-gated）
- [ ] PR が `dev` base で open され URL が記録されている
- [ ] CI（required status checks）すべて green

## 出力

- `outputs/phase-13/phase-13.md`（本仕様）
- 実装サイクルで PR URL を `outputs/phase-13/pr.md` 等に記録予定

## 参照資料

- `outputs/phase-5/task-01..03-*.md`（実装仕様書本体）
- `outputs/phase-12/implementation-guide.md`（PR 本文の根拠）
- `CLAUDE.md` §「PR作成の完全自律フロー」
