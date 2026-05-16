# parallel-10-auth-session-handling - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/web/src/features/admin/hooks/useAdminMutation.ts` の親仕様（parallel-08 / serial-05 step-01）を拡張し、`apps/web/src/components/ui/Toast.tsx` への alert/status variant 追加、401/403 catch ロジック・redirect URL 生成・toast 連携の実装、対応 unit/integration test 追加を伴うコード実装タスク。`fetchAuthed` / `toLoginRedirect` / `normalizeRedirectPath` は既存実装の検証で済むが、admin hook 層と Toast 互換 API は実装が必須のため docs-only にはならない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | PARALLEL-10-AUTH-SESSION |
| タスク名 | API 401/403 ハンドリングと session refresh の統一 |
| ディレクトリ | docs/30-workflows/parallel-10-auth-session-handling |
| 親タスク | docs/30-workflows/ui-prototype-alignment-mvp-recovery |
| 原典 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-10-auth-session-handling/spec.md |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 状態 | implemented_local_evidence_captured / Phase 13 blocked_pending_user_approval |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | MEDIUM |
| GitHub Issue | 未起票（親 workflow 内の sub-task として実施。単独 Issue 化なし） |

## 目的

API 呼び出し中の 401（認証要求）/ 403（権限不足）応答に対するフロント挙動を統一する。`fetchAuthed` が
throw する `AuthRequiredError` / `FetchAuthedError` を mutation 共通 hook `useAdminMutation` で
一元 catch し、401 は `/login?redirect=<current>` への安全な redirect、403 は toast による通知 +
フォーム state 保持に振り分ける。これにより session 切れ・権限不足時の UX を改善ワークフロー全体で揃え、
個別 mutation 毎の場当たり対応を排除する。

## スコープ

### 含む

- 既存 `apps/web/src/lib/fetch/authed.ts` の 401/403 throw 仕様の検証と spec 化
- 既存 `apps/web/src/lib/url/login-redirect.ts` / `safe-redirect.ts` の open redirect 防止仕様の再検証と test 補強
- `apps/web/src/lib/auth.ts` の session callback / JWT TTL 確認・silent refresh 採否の文書化（決定: MVP では silent refresh 未導入、24h TTL 内 expiry は 401 → redirect で吸収）
- `apps/web/src/features/admin/hooks/useAdminMutation.ts` の親仕様準拠拡張（`trigger` / `isLoading` / `error` / `reset` を返す client hook）
- 既存 `apps/web/src/components/ui/Toast.tsx` の `useToast()` を維持しつつ、hook 層から利用しやすい関数経路（`useToast` ベースの薄いアダプタ）を追加
- 新規 spec test（`useAdminMutation.spec.ts`, `Toast.spec.tsx`）と既存 spec の補強

### 含まない

- API 側（`apps/api`）の 401/403 応答仕様変更
- D1 schema 変更・Google Form 仕様変更・新規 API endpoint 追加
- Auth.js の silent refresh / token renew endpoint 新設（MVP スコープ外。本 spec に判定根拠のみ残す）
- Storybook 追加（既存運用がないため対象外）
- e2e（Playwright）の新規シナリオ追加（既存 e2e で 401 redirect が観測できることを確認するに留める）

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-10-auth-session-handling/spec.md | 原典タスク仕様 |
| 必須 | apps/web/src/lib/fetch/authed.ts | 401/403 throw 仕様の正本 |
| 必須 | apps/web/src/lib/url/login-redirect.ts | redirect URL 生成正本 |
| 必須 | apps/web/src/lib/url/safe-redirect.ts | open redirect 防止 |
| 必須 | apps/web/src/lib/auth.ts | session callback / JWT TTL |
| 必須 | apps/web/src/components/ui/Toast.tsx | Toast Provider 現行実装 |
| 必須 | CLAUDE.md | UI prototype alignment 不変条件 / 設計トークン正本 |
| 参考 | docs/00-getting-started-manual/specs/02-auth.md | 認証設計 |
| 参考 | docs/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証方針 |

## 受入条件 (AC)

- **AC-1**: `apps/web/src/lib/fetch/authed.ts` の 401 → `AuthRequiredError` / 非2xx → `FetchAuthedError(status, body)` throw が unit test で網羅されている（status 200/401/403/500/network error の 5 ケース）。
- **AC-2**: `apps/web/src/features/admin/hooks/useAdminMutation.ts` が親仕様の `endpoint + method + options` API を維持したまま拡張され、401 → `window.location.assign(toLoginRedirect(currentPath))`、403 → `toast("権限がありません", "alert")` + `error` state 設定、その他 → `error` state 設定の 3 経路が単体テストで実証されている。
- **AC-3**: `useAdminMutation` は `{ trigger, isLoading, error, reset }` を返し、`trigger` 実行中は `isLoading=true`、完了後は false に戻る。
- **AC-4**: `apps/web/src/lib/url/login-redirect.ts` + `safe-redirect.ts` の open redirect 防止が以下 5 ケースで unit test PASS する: `"/admin"` → そのまま、`"//evil.com"` → fallback、`"http://evil.com"` → fallback、`"/admin\\..\\evil"` → fallback、`"/login?redirect=%2Fadmin"` → fallback。
- **AC-5**: `apps/web/src/lib/auth.ts` の session callback / JWT TTL について、MVP では silent refresh 未導入である決定根拠が `outputs/phase-02/auth-session-policy.md` に記録されている。
- **AC-6**: `apps/web/src/components/ui/Toast.tsx` に `role="alert"` を出し分ける variant が追加されており、403 経路で alert role の toast が描画されることが test で確認されている。
- **AC-7**: 設計レビュー結果（GO / NO-GO）が `outputs/phase-03/design-review.md` に記録されている。
- **AC-8**: typecheck / lint / unit test（vitest）/ build が local `completed (exit 0)` となり、evidence が `outputs/phase-11/evidence/{typecheck,lint,test,build}.log` に保存されている。
- **AC-9**: Phase 12 必須 7 ファイル（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が生成済み。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{auth-session-policy,hook-design,toast-extension-design,error-handling-matrix}.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | タスク分解 | phase-04.md | completed | outputs/phase-04/{task-breakdown,critical-path}.md |
| 5 | 実装計画 | phase-05.md | completed | outputs/phase-05/implementation-plan.md |
| 6 | 実装手順 | phase-06.md | completed | outputs/phase-06/implementation-steps.md |
| 7 | テスト計画 | phase-07.md | completed | outputs/phase-07/test-plan.md |
| 8 | ドキュメント更新 | phase-08.md | completed | outputs/phase-08/docs-updates.md |
| 9 | 受入確認 | phase-09.md | completed | outputs/phase-09/acceptance.md |
| 10 | リファクタ | phase-10.md | completed | outputs/phase-10/refactor-summary.md |
| 11 | evidence | phase-11.md | completed | outputs/phase-11/evidence/{typecheck,lint,test,build}.txt |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR・振り返り | phase-13.md | blocked | user approval gate（commit / push / PR 未実行） |

## 不変条件

1. **既存 API surface のみ**: `apps/api` の endpoint を変更しない。401/403 応答 contract は現状維持。
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding を呼ばない。本 hook は `fetchAuthed` 経由のみ。
3. **OKLch トークン正本化**: Toast variant 追加時も `apps/web/src/styles/tokens.css` の OKLch token を参照し、HEX 直書き禁止。
4. **open redirect 防止**: redirect query は必ず `normalizeRedirectPath` を通す。
5. **client/server 境界**: `useAdminMutation` は `"use client"` 必須。`window.location` 参照は client only。SSR では呼ばれない設計を test で固定。
6. **CONST_007 遵守**: Phase 1〜13 を本サイクル内で完了させ、別 PR への先送りは行わない。silent refresh の MVP 採否は決定として確定させる。

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `window.location` 直接操作で test が壊れる | `useAdminMutation` の redirect は `redirector` をオプション DI 可能にし、test では mock を注入 |
| Redirect loop（`/login?redirect=/login?...`） | `normalizeRedirectPath` の対象に `/login` で始まる path も fallback 対象として追加 |
| Toast Provider 未配置画面で hook が throw | hook 側で `useToast` を直接呼ばず、optional `toaster` を DI 可能とし、未注入時は console.warn でフォールバック |
| 403 後の form 状態が残り stale 更新を許す | `error` state 表示 + `reset()` を呼び出し側で明示 trigger（PR コメントで利用箇所をチェック） |
| Auth.js silent refresh 未実装による UX 劣化 | MVP 24h TTL を `02-auth.md` で再確認し、現状 401→redirect で吸収できる旨を `phase-02/auth-session-policy.md` に明記 |
| Redirect loop（`/login?redirect=/login?...`） | `/login` で始まる redirect input は `normalizeRedirectPath` で fallback へ落とす test を AC-4 に含める |

## Phase マップ

```
phase-01 (要件定義)
  └─ outputs/phase-01/requirements.md
       ▼
phase-02 (設計: hook / toast / auth policy / error matrix)
       ▼
phase-03 (設計レビュー)
       ▼
phase-04 (タスク分解) → phase-05 (実装計画) → phase-06 (実装手順)
       ▼
phase-07 (テスト計画) → phase-08 (docs 更新) → phase-09 (受入)
       ▼
phase-10 (refactor) → phase-11 (evidence) → phase-12 (正本同期)
       ▼
phase-13 (PR / user approval gate)
```
