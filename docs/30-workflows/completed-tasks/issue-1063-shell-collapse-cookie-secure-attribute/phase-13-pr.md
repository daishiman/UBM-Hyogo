# Phase 13: PR

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 13（PR / Gate-C） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| workflow_state | implemented_local_evidence_captured |
| base ブランチ | `dev` |
| 作業ブランチ | `feat/issue-1063-shell-collapse-cookie-secure-attribute` |
| issue | #1063（CLOSED のまま再スコープ・reopen しない） |

## 目的

PR 作成手順を確定する。PR / commit / push は **user 明示承認後のみ**実行し、本サイクルでは一切実行しない。

## 実行タスク

### 13.1 実行条件（Gate-C）

commit / push / PR / GitHub Issue mutation は **user 明示承認後のみ**実行する。local implementation 後も user 承認が無い限り **NOT EXECUTED**。issue #1063 は CLOSED のまま再スコープしており、reopen しない。

### 13.2 PR タイトル案

`feat(web): issue-1063 shell collapse cookie に production 限定で Secure 属性を付与`

### 13.3 PR 本文骨子

```markdown
## 概要

shell collapse 永続化 cookie（`ubm_shell_collapsed`）に対し、production(HTTPS) 配信時のみ
`; Secure` 属性を付与する。環境判定は client runtime（`browserDocument()?.location.protocol === "https:"`）
で行い、`apps/web/src` 配下へ `process.env.*` 直接参照を増やさない。localhost(http) では従来どおり
`Secure` 無しで発行し、collapse 永続化が回帰しない。cookie 名・value・`Path`・`Max-Age`・`SameSite` は
issue-1024 と同一で不変。`HttpOnly` は付与しない（client が読み書きするため）。

Refs #1063（CLOSED のまま現行コードへ再スコープ。reopen しない）

## 変更内容

### 編集
- `apps/web/src/components/shell/shell-collapse-cookie.ts`
  - private ヘルパ `isSecureRuntimeContext()` を新設（`browserDocument()?.location.protocol === "https:"`）。
  - `serializeShellCollapsedCookie(collapsed, secure = isSecureRuntimeContext())` へ第2引数を追加し、
    `secure` が true のとき戻り値末尾に `; Secure` を append。
  - `writeShellCollapsedCookie` / parser / reader / alias は無改修（後方互換）。
- `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`
  - `Secure` 属性の focused test（TC-1〜TC-6）を追記。既存ケースは維持。

## 受入条件
- [ ] AC-1 production 判定（secure=true）で `; Secure` を末尾付与
- [ ] AC-2 dev 判定（secure=false）で `Secure` を付与しない
- [ ] AC-3 default-path（jsdom http / SSR）で `Secure` を付与しない・`process.env` 不導入
- [ ] AC-4 既存属性（Path=/ / Max-Age=31536000 / SameSite=Lax / value）が回帰しない
- [ ] AC-5 parser / reader / writer・hook 戻り値・SSR seed が後方互換で回帰しない
- [ ] AC-6 shell 系 focused spec 全 pass

## 検証
- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`

## 視覚証跡
UI/UX 変更なし（NON_VISUAL）のため Phase 11 スクリーンショットなし。
`Secure` は送信制御属性で read 値・レンダリングに現れないため、代替 = focused Vitest の serializer 戻り値検証。
```

### 13.4 含めるファイル

| 区分 | パス |
|------|------|
| 実装（編集） | `apps/web/src/components/shell/shell-collapse-cookie.ts` |
| テスト（編集） | `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` |
| 仕様書 | `docs/30-workflows/completed-tasks/issue-1063-shell-collapse-cookie-secure-attribute/`（本 workflow dir 一式） |

### 13.5 実行手順（user 承認後）

1. `git add apps/web/src/components/shell/shell-collapse-cookie.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`（編集 2）。
2. `git add docs/30-workflows/completed-tasks/issue-1063-shell-collapse-cookie-secure-attribute/`（仕様書一式）。
3. `git commit`（メッセージ末尾に `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` を付与）。
4. `git push -u origin feat/issue-1063-shell-collapse-cookie-secure-attribute`。
5. `gh pr create --base dev --title "feat(web): issue-1063 shell collapse cookie に production 限定で Secure 属性を付与" --body-file <本文>`。
6. PR URL を `outputs/phase-13/pr-creation-result.md` へ記録（Gate-C evidence）。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| 実装手順 | `phase-5-implementation.md` | serializer After 逐語 |
| PR 情報 | `outputs/phase-13/pr-info.md` | base/head/title |
| close-out 結果 | `outputs/phase-13/pr-creation-result.md` | Gate-C status |

## 統合テスト連携

PR 作成後の remote CI（typecheck / lint / focused Vitest）が serializer 文字列検証を再実行する。本タスクは後方互換変更のため shell 系既存 suite（`useSidebarState.spec.tsx` / `SidebarShell.server.spec.tsx`）に回帰を起こさない。

## 成果物

- 本ファイル（`phase-13-pr.md`）= PR タイトル案・本文骨子・含めるファイル・実行手順（user 承認後）。
- `outputs/phase-13/`（change-summary / local-check-result / pr-creation-result / pr-info）。

## 完了条件

- PR タイトル案・本文骨子・base=`dev` が確定している。
- 含めるファイル（apps/web 編集 2 + 本 workflow dir）が列挙されている。
- commit / push / PR が本サイクルで NOT EXECUTED（user 明示承認待ち）であることが明記されている。
