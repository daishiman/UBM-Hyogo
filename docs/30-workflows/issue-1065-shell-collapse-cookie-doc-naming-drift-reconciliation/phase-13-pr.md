# Phase 13 — PR 作成（user-gated）

- 区分: 実装仕様書（NON_VISUAL / spec_created）
- PR base ブランチ: `dev`（CLAUDE.md PR フロー既定）
- branch: `docs/issue-1065-shell-collapse-cookie-naming-drift`

---

## 重要な境界

- PR は **user の明示承認後のみ**作成する。
- **本仕様書作成プロンプトでは commit / PR を一切実行しない。** 以下は実装/承認後 wave で用いる計画である。
- 実装（alias 3 行削除・doc 3 本整合）も user-gated。実装が済んでいない段階で PR は作成しない。

## 想定 PR タイトル案

```
docs+refactor(shell): shell-collapse-cookie 命名 SSOT を code-primary に確定 (dead alias 3件削除 + 設計doc整合) (#1065)
```

## PR 本文骨子

### 変更概要

- `apps/web/src/components/shell/shell-collapse-cookie.ts` の **dead alias 3 件削除**:
  - `SHELL_COLLAPSE_COOKIE`（→ `SHELL_COLLAPSE_COOKIE_NAME`）
  - `readCollapsedFromCookieString`（→ `parseShellCollapsedCookie`）
  - `writeCollapsedCookie`（→ `writeShellCollapsedCookie`）
- 3 alias とも apps/web/src 内 0 参照（削除前 grep 0 件確認）。
- 設計 doc を primary 名へ整合（AC-1 対象 = phase-2-design / implementation-guide。phase-3-design-review は旧名 0 で no-op）。
- **SSOT 完遂レビュー（user 決定）**: issue-1024 配下の他 phase doc（phase-4/5/6/7/8/9/13 + outputs/phase-12 系）も同一置換マップで primary 名へ全整合。`apps/`・`packages/`・`specs/`・issue-1024 doc 全体で dead alias を 0 化（残るのは「削除済みを説明する枠組み」のみ）。
- 命名 SSOT を code-primary に確定。issue 前提誤り（parser のヘッダ vs 値の契約誤認）を implementation-guide に訂正注記として記録。

### 受入条件（AC）

| AC | 内容 |
| --- | --- |
| AC-1 | 設計 doc 3 本が primary 名に一致 |
| AC-2 | SSOT 対応表 + 値 parser 訂正注記を記録 |
| AC-3 | dead alias 3 件削除（削除前 grep 0 件） |
| AC-4 | typecheck / lint / focused Vitest green・diff は alias 3 行削除のみ |
| AC-5 | cookie 名 / value / 属性 無変更（I-6） |

### 検証コマンド結果欄（実装 wave で記入）

```
$ mise exec -- pnpm typecheck     → （実装後に記入）
$ mise exec -- pnpm lint          → （実装後に記入）
$ mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
    apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts  → （実装後に記入）
$ git diff --stat                 → shell-collapse-cookie.ts: -3 行 + issue-1024 doc 群（SSOT 完遂で 12 doc）の primary 名整合
```

### スクリーンショット

UI/UX 変更なしのため不要（NON_VISUAL）。

---

## PR 作成手順（承認後）

1. `git fetch origin dev` → ローカル `dev` を fast-forward 同期。
2. 作業ブランチに `dev` をマージ（コンフリクト時は CLAUDE.md 既定方針）。
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. `git add -A` → commit（末尾に Co-Authored-By 行）。
5. `gh pr create --base dev` で作成（本文は本骨子 + implementation-guide 反映）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
