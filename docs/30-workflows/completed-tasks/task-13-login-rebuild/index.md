# task-13 login-rebuild — Phase 1〜13 タスク仕様書 index

> 出典: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/06-screens-member/task-13-w5-par-login-rebuild.md`
> 作成日: 2026-05-09
> 状態: `implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING`
> 実装区分: **実装済みローカル**（apps/web のコード・テスト・E2E smoke は本 cycle で反映済み。staging smoke・commit・push・PR は user gate 後に実施）
> 親 workflow: `ui-prototype-alignment-mvp-recovery`
> スコープ判定: Phase 1〜13 の仕様、apps/web 実装、Phase 11 local screenshot evidence、Phase 12 strict evidence を今回サイクルで同期する。

## 概要

`/login` 画面を Auth.js デフォルト UI から prototype 準拠の **カード型ログインカード** へリビルドし、URL query 駆動の **5 core states（input / sent / unregistered / deleted / error）+ rules_declined derived state + gate=admin_required overlay** を OKLch tokens のみで描画する実装タスクの Phase 1〜13 仕様書。

| 項目 | 値 |
|------|----|
| Task ID | task-13 |
| 対象 route | `/login`（App Router / Cloudflare Workers SSR） |
| workflow_state | `implemented-local` |
| implementation_status | `implemented_local_runtime_pending` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| 依存元 | task-09（Tailwind v4 / OKLch tokens）, task-10（ui-primitives） |
| 依存先 | task-18（Playwright smoke + verify-design-tokens） |
| 並列可能 | task-11/12/14/15/16/17 と完全並列 |
| 主要 DoD | OKLch tokens のみ（HEX 0 件）/ 5 状態 Playwright smoke green / API surface 不変 |

## Phase 一覧

| Phase | タイトル | 主目的 | 主要成果物 |
|-------|---------|-------|-----------|
| 1 | 要件定義 | 5 状態 + DoD 確定 | `outputs/phase-01/main.md` |
| 2 | アーキテクチャ設計 | コンポーネント分割・責務境界 | `outputs/phase-02/main.md` |
| 3 | 詳細設計 | Props 型・状態遷移・データフロー | `outputs/phase-03/main.md` |
| 4 | 実装タスク分解 | SRP 単位の編集計画 | `outputs/phase-04/main.md` |
| 5 | 実装（コア） | LoginCard / LoginStatus / LoginPanel rebuild | コード差分 |
| 6 | 単体テスト | Vitest（5 状態 + form validation） | `__tests__/*.test.tsx` |
| 7 | 統合テスト | gate-state proxy 経由の API 経路確認 | integration test |
| 8 | a11y 検証 | jest-axe 5 状態 critical 0 | a11y report |
| 9 | E2E smoke | Playwright 5 状態 + data-state 属性 + screenshot | `apps/web/playwright/tests/login-smoke.spec.ts` |
| 10 | tokens / lint gate | verify-design-tokens HEX 0 | gate report |
| 11 | 視覚 evidence | dev URL 巡回 + screenshot | `outputs/phase-11/*.png` |
| 12 | 実装ガイド（平易説明） | 中学生レベルでの解説 | `outputs/phase-12/implementation-guide.md` |
| 13 | PR 作成 | diff-to-pr 仕様準拠 | PR URL |

## Phase ファイル

| Phase | Path |
| --- | --- |
| 1 | `phase-01.md` |
| 2 | `phase-02.md` |
| 3 | `phase-03.md` |
| 4 | `phase-04.md` |
| 5 | `phase-05.md` |
| 6 | `phase-06.md` |
| 7 | `phase-07.md` |
| 8 | `phase-08.md` |
| 9 | `phase-09.md` |
| 10 | `phase-10.md` |
| 11 | `phase-11.md` |
| 12 | `phase-12.md` |
| 13 | `phase-13.md` |

## 状態語彙

- `implemented-local`: `apps/web` 実装、focused Vitest、Playwright smoke、Phase 11 local screenshot evidence、Phase 12 strict 7 outputs をローカル反映済み。
- `runtime_pending`: staging smoke / production-equivalent runtime evidence は未実行で、後続 user-approved cycle の対象。
- `completed`: runtime evidence と PR 作成が user approval 後に完了した場合のみ使用する。現時点では使用禁止。

## 不変条件（全 Phase 共通）

1. URL query が gate state の正本（state machine の唯一の真実、SSR で確定）
2. `/no-access` ルートは復活させない
3. Auth.js + Magic Link API surface は不変（`apps/web/app/api/auth/*` 変更禁止）
4. クライアント mutation は `fetch` + `router.replace` パターン継続（Server Action 不採用）
5. `apps/web` から D1 への直接アクセス禁止（gate-state は `apps/api` への proxy）
6. HEX 直書き禁止（OKLch tokens 経由のみ）
7. `redirect` クエリは同一オリジン path のみ許可（open redirect 防止）
8. session storage / localStorage に state を保存しない

## 後続実装で触れるファイル群（write）

- `apps/web/app/login/page.tsx`（M）
- `apps/web/app/login/_components/LoginPanel.client.tsx`（rebuild）
- `apps/web/app/login/_components/LoginCard.tsx`（new）
- `apps/web/app/login/_components/LoginStatus.tsx`（new）
- `apps/web/app/login/_components/MagicLinkForm.client.tsx`（minor）
- `apps/web/app/login/_components/GoogleOAuthButton.client.tsx`（minor）
- `apps/web/src/lib/url/login-query.ts`（`"error"` 追加）
- `apps/web/app/login/_components/__tests__/{LoginPanel,LoginCard}.test.tsx`（new）
- `apps/web/playwright/tests/login-smoke.spec.ts`（append）

## 実行ゲート

- 本仕様 package では commit / push / PR 作成を実行しない。
- Phase 13 は PR 準備仕様であり、branch 作成・commit・push・`gh pr create` はユーザーが明示的に「PR を作成して」と指示した後に限る。
- 実コード差分が追加済みのため `workflow_state` は `implemented-local` とし、Phase 11 evidence と Phase 12 compliance を同一 wave で更新する。

## 参照ドキュメント

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/06-screens-member/task-13-w5-par-login-rebuild.md`（出典）
- `docs/00-getting-started-manual/specs/02-auth.md` / `13-mvp-auth.md` / `06-member-auth.md`
- `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1..3/`
