# Phase 13 — PR 作成（issue-1111-proxy-transport-util-unify）

PR 作成手順。**本 Phase の全アクション（commit / push / PR 作成）は user 明示承認後にのみ実行する**（`pending_user_approval`）。実コードとローカル検証は Phase 12 close-out までに完了済み。

## メタ

| Key | Value |
| --- | --- |
| PR base | `dev` |
| 作業ブランチ案 | `refactor/issue-1111-proxy-transport-util-unify` |
| PR タイトル案 | `refactor(web): admin/public transport 選択ロジックを transport-select util へ集約 (Refs #1111)` |
| source Issue | [#1111](https://github.com/daishiman/UBM-Hyogo/issues/1111)（`CLOSED`・Refs として参照のみ。Issue 状態 mutation は user-gated） |
| 実行可否 | user 明示承認後のみ（commit / push / PR は user-gated） |

## PR に含めるファイル一覧

### spec docs（本ワークフロー・既に作成済）

```
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/index.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/artifacts.json
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/phase-01-requirements.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/phase-02-design.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/phase-03-design-review.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/phase-04-test-creation.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/phase-08-refactoring.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/phase-13-pr-creation.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/outputs/artifacts.json
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/outputs/phase-12/main.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/outputs/phase-12/implementation-guide.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/outputs/phase-12/system-spec-update-summary.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/outputs/phase-12/documentation-changelog.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/outputs/phase-12/unassigned-task-detection.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/outputs/phase-12/skill-feedback-report.md
docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/outputs/phase-12/phase12-task-spec-compliance-check.md
```

### apps/web 実装（完了済み）

```
apps/web/src/lib/fetch/transport-select.ts            （新規 util）
apps/web/src/lib/fetch/__tests__/transport-select.spec.ts （新規 util spec）
apps/web/app/api/admin/[...path]/route.ts             （切替1: admin mutation）
apps/web/src/lib/admin/server-fetch.ts                （切替2: admin read）
apps/web/src/lib/fetch/public.ts                      （切替3: public read）
```

> 既存回帰 spec（`route.spec.ts` / `server-fetch.binding.spec.ts` / `server-fetch.http-fallback.spec.ts` / `server-fetch.env.spec.ts` / `public.spec.ts`）は緑のまま維持する（変更が必要な場合のみ diff に含まれる）。

## PR 本文骨子

- **目的**: 「binding 優先 → HTTP fallback」transport 選択イディオムの 3 ファイル複製を新規 pure util `transport-select.ts` へ集約し、transport 仕様変更時の同期漏れ（drift）を根絶する。
- **集約対象 3**: admin mutation（`route.ts`・ログ無し・base 不在時 500）/ admin read（`server-fetch.ts`・logAdminTransport scope:admin）/ public read（`public.ts`・logTransport scope 無し）。
- **スコープ外**: `auth.ts`（軽量変種・同型でない別形状ゆえ統合しない／pure refactor を守るため）。
- **YAGNI 解除**: 3 箇所目 `public.ts` の同型コピー出現で Rule of Three 成立。
- **pure refactor 保証**: 判定述語（`isTestOrPlaywright`）・fallback base 解決・transport ログ shape を呼び出し側に残し、util は制御構造の骨格のみ共通化。挙動完全不変。
- **不変条件**: env は env.ts アクセサ経由・`process.env` 新規追加なし／`LOCAL_DEV_FALLBACK`（127.0.0.1:8787）を route.ts に残し util へ移送しない・`127.0.0.1:8888` 焼き込み禁止（task-18）／D1 直接アクセス禁止／`*.spec.ts` のみ。
- **検証**: typecheck / lint / focused vitest（util spec + 5 既存回帰 spec）/ verify:phase12-compliance。
- **視覚証跡**: UI/UX 変更なし（NON_VISUAL）のため Phase 11 スクリーンショット不要。

## 実行手順（user 明示承認後のみ）

1. 作業ブランチ作成（`dev` 起点）。
2. `transport-select.ts` 新規作成 + util spec 作成 + 3 呼び出し側切替を実装。
3. `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` / `lint` / focused vitest / `verify:phase12-compliance` を実行し緑を確認。
4. `git add -A` → commit。
5. push → `gh pr create --base dev`。

> commit メッセージ末尾・PR 本文末尾の規約フッターは PR 作成フローに従う。**いずれのステップも user 明示承認まで実行しない。**

## user-gated boundary

commit、push、PR 作成、CLOSED Issue #1111 の状態 mutation は、いずれも user 明示承認後にのみ実行する。本ワークフローは Phase 12 完了条件に基づき completed-tasks へ移動済みであり、Phase 13 の mutation 境界は引き続き user-gated とする。
