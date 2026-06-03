---
task_id: issue-1063-shell-collapse-cookie-secure-attribute
spec_classification: implementation_spec
state: implemented_local_evidence_captured
created_at: 2026-06-03
task_type: implementation
visual_category: NON_VISUAL
implementation_mode: new
issue: 1063
issue_state: CLOSED
issue_state_note: GitHub Issue #1063 は CLOSED。本仕様書は CLOSED のまま現行コードへ再スコープして作成する（reopen しない）。
parent_workflow: docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/
source_task: docs/30-workflows/completed-tasks/issue-1024-followup-001-cookie-secure-attribute-production-hardening.md
branch: feat/issue-1063-shell-collapse-cookie-secure-attribute
---

# issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

GitHub Issue #1063（`issue-1024-followup-001-cookie-secure-attribute-production-hardening`）を **現行コードに再スコープ**した Phase 1-13 単一責務実装仕様書ディレクトリ。後続の実装プロンプト（`03.実装.md`）が、このディレクトリだけを読めば確実にコードへ反映できる粒度で記述する。

## 実装区分

`[実装区分: 実装仕様書]` — `apps/web/src/components/shell/shell-collapse-cookie.ts` の cookie serializer へ環境分岐ロジックと focused test を追加するコード変更タスクであるため（CONST_004）。Issue 本文の「スコープ」も serializer への `Secure` 環境分岐 + focused Vitest を明示しており、docs-only ではない。

## 調査サマリ（issue はローカル実装済み・外部操作待ち）

Issue #1063 起票（2026-05-31）当時の前提「現行 serializer は `Path=/; Max-Age=...; SameSite=Lax` のみで `Secure` 無し」は、着手時 HEAD（`ca3fb9336`）でも一致していた。
本実行サイクルで `apps/web/src/components/shell/shell-collapse-cookie.ts` と focused spec を更新し、local focused Vitest 8 tests PASS を取得した。commit / push / PR / staging DevTools smoke は user-gated のまま残す。

| 観点 | 確認結果 |
|------|---------|
| 現行 serializer に `Secure` 付与ロジック | **追加済み**（HTTPS runtime / explicit `secure=true` で `; Secure` append） |
| 全ローカルブランチでの実装有無 | **0 件**（`git show <branch>:apps/web/src/components/shell/shell-collapse-cookie.ts | grep Secure` が全ブランチで hit 無し） |
| focused test（`shell-collapse-cookie.spec.ts`） | `Secure` ON / OFF / jsdom default / parser 後方互換を検証。8 tests PASS |
| issue 状態 | #1063 **CLOSED**（closedAt 2026-06-02）。reopen せず CLOSED のまま spec 作成 |

> 結論: **issue #1063 の hardening はローカル実装済み**。外部操作（commit / push / PR / staging DevTools smoke）は user-gated として残す。

## ゴール（要旨）

1. `ubm_shell_collapsed` cookie を **production（HTTPS）でのみ `; Secure` 付き**で発行する。
2. localhost dev（`http://`）では従来どおり `Secure` 無しで発行し、collapse 永続化が回帰しない。
3. 環境判定は **client runtime（`browserDocument()?.location.protocol === "https:"`）** で行い、`apps/web/src` 配下に `process.env.*` 直接参照を増やさない（CLAUDE.md「`apps/web` env アクセス不変条件」）。
4. cookie 名・value・`SameSite`・`Max-Age`・`Path` は issue-1024 と同一（不変条件 I-6 維持）。`HttpOnly` は付与しない。
5. parser（read 経路）は無改修・後方互換。SSR seed / hydration 挙動が回帰しない。

## スコープ（編集 2 / 新規 0）

### 編集（2）

- `apps/web/src/components/shell/shell-collapse-cookie.ts` — `serializeShellCollapsedCookie` に `secure` 環境分岐を追加（runtime 判定ヘルパ `isSecureRuntimeContext` を内部に新設）。
- `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` — production→`Secure` 付与 / dev→`Secure` 無し / default-path(jsdom http) / parser 後方互換 の 4 観点を追記。

### 新規（0）

- 新規ファイルは作成しない。既存 serializer module 内に環境分岐を閉じ込める（issue-1024 の「cookie I/O 単一 source」不変条件を維持）。

## 前提（prerequisite）

本 spec は親 workflow `issue-1024-sidebar-collapse-cookie-persistence`（cookie 永続化 + SSR seed）が **dev にマージ済み**であり、`shell-collapse-cookie.ts` の `serializeShellCollapsedCookie` / `writeShellCollapsedCookie` / `parseShellCollapsedCookie` が実在することを前提とする（現行 HEAD で実在確認済み）。本タスクはその serializer に `Secure` 属性を**追加**する後方互換変更で、新規 state store も新規 cookie も増やさない。

## 不変条件（要旨）

- I-1: cookie I/O は `shell-collapse-cookie.ts` 1 module へ集約（issue-1024 不変条件継承）。`Secure` 分岐も serializer 内に閉じ込め、呼出側（`writeShellCollapsedCookie` / `useSidebarState`）は分岐を意識しない。
- I-2: cookie 名 `ubm_shell_collapsed` / value（`true`/`false`）/ `Path=/` / `Max-Age=31536000` / `SameSite=Lax` は不変（issue-1024 I-6）。本タスクは `; Secure` の有無のみを切り替える。
- I-3: `HttpOnly` は付与しない（client が読み書きするため。issue-1024 I-6 維持）。
- I-4: 環境判定は `process.env.*` を `apps/web/src` 配下へ新規に焼き込まない。`document` アクセスは `apps/web/src/lib/is-browser.ts` の `browserDocument()` 経由とする（CLAUDE.md env 不変条件 / issue-1024 I-5）。
- I-5: parser（`parseShellCollapsedCookie` / `readCollapsedFromDocument`）は無改修。`Secure` 属性は送信制御であり cookie value には現れないため read 経路に影響しない。
- I-6: API endpoint / D1 / Google Form schema / auth middleware は不変（親不変条件 #5）。色・寸法 token も不変（本タスクは CSS 変更なし）。

## Phase 一覧

| Phase | 名称 | ファイル |
|-------|------|---------|
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計 | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA / CI gate | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / Evidence | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | PR | [phase-13-pr.md](phase-13-pr.md) |

## 関連 task

- 起点 spec: `docs/30-workflows/completed-tasks/issue-1024-followup-001-cookie-secure-attribute-production-hardening.md`
- 親: `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/`
- sibling: `issue-1024-followup-002`（doc 命名ドリフト整合 / #1065）— 本タスクとは別関心（cookie 名のドキュメント整合であり serializer 属性とは独立）
