# Phase 13: PR作成（user-gated） — issue-230-lefthook-edit-guard

> **重要: 本 Phase は手順の記述のみ。commit / push / PR 作成 / issue close は一切実行しない。**
> すべて **user-gated**（ユーザーの明示指示後にのみ実行）。Claude Code は本仕様書を読んで実行待機する。
> Issue #230 は **OPEN** のまま維持し、PR 文脈は `Refs #230`（`Closes` ではない — close 判断は user-gated）。

## 13.1 前提

| 項目 | 値 |
|------|-----|
| 作業ブランチ | `feat/issue-230-lefthook-edit-guard-spec` |
| PR base ブランチ | `dev`（既定。production リリース時のみ `main`） |
| Issue | #230（OPEN 維持） |
| 実行可否 | **すべて user-gated**（commit / push / PR / issue mutation を本 Phase では実行しない） |

## 13.2 PR 作成前チェック（実行はユーザー指示後）

ユーザーが「PR作成」を指示した時点で、CLAUDE.md「PR作成の完全自律フロー」に従って以下を確認する。

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期
2. 作業ブランチに `dev` をマージ（コンフリクトは CLAUDE.md の既定方針で自律解消）
3. 品質検証 4 コマンド:
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
4. 加えて本タスク固有の検証（Phase 9 §9.1）:
   - `mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts`
   - `bash scripts/verify-hook-integrity.sh`
5. `git status --porcelain` が空、`git diff dev...HEAD --name-only` で PR 対象ファイル一覧を取得

## 13.3 PR タイトル案

```
feat(issue-230): lefthook.yml 直編集 ack ゲート + 手書き .git/hooks 検知 + CI integrity gate
```

## 13.4 PR 本文骨子

```markdown
## Summary

Git hook 正本（`lefthook.yml`）からの逸脱 drift を機械検知する 2 段ガードを追加する。

- **local pre-commit guard**（`scripts/hooks/lefthook-edit-guard.sh`）:
  lefthook 非管理の手書き `.git/hooks/*` を検知し block。`lefthook.yml` の直編集は
  `LEFTHOOK_EDIT_ACK=1` の明示 ack が無ければ block。
- **CI integrity gate**（`scripts/verify-hook-integrity.sh` + `.github/workflows/verify-hook-integrity.yml`）:
  `lefthook.yml` が参照する `scripts/hooks/*.sh` の実在 + tracked stray hook 不在を検証。

Issue #230 の AC を最新コードの観測可能面へ最適化した（`.git/` は repo 管理外で
CI checkout に現れないため AC-1 の CI literal を local pre-commit + CI integrity へ再配置。
solo 運用で必須 review が 0 のため AC-2 を ack ゲートで代替）。

## 変更ファイル一覧

| ファイル | 種別 | 役割 |
|---------|------|------|
| `scripts/hooks/lefthook-edit-guard.sh` | 新規 | pre-commit guard 本体（R-1 local / R-2 / R-3 / R-4） |
| `scripts/verify-hook-integrity.sh` | 新規 | lefthook.yml ↔ scripts 参照整合 + tracked stray 検知 |
| `.github/workflows/verify-hook-integrity.yml` | 新規 | CI gate（push/PR → main, dev） |
| `lefthook.yml` | 編集 | `pre-commit.commands.lefthook-edit-guard` 追加 |
| `scripts/hooks/__tests__/lefthook-edit-guard.spec.ts` | 新規 | guard の fixture テスト |
| `scripts/__tests__/verify-hook-integrity.spec.ts` | 新規 | integrity の fixture テスト |
| `docs/00-getting-started-manual/lefthook-operations.md` | 編集 | 新 guard 運用節追記（AC-3 リンク先） |
| `CLAUDE.md` | 編集 | 「Git hook の方針」節に guard / CI gate 追記（AC-3 アンカー） |
| `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/**` | 新規 | 本タスク仕様書一式（Phase 1-13） |

## AC 充足表

| AC | 充足根拠 |
|----|---------|
| AC-1 | pre-commit guard が手書き `.git/hooks/*` を block（local）+ CI integrity が lefthook.yml ↔ scripts 整合を検証 |
| AC-2 | `lefthook.yml` stage 時に `LEFTHOOK_EDIT_ACK=1` 無で block（ack ゲートで review 必須化を代替） |
| AC-3 | block メッセージに `CLAUDE.md「Git hook の方針」` + `docs/00-getting-started-manual/lefthook-operations.md` 導線 |
| AC-4 | `.sample` 除外 / lefthook 署名 hook 除外 / merge・rebase・cherry-pick・revert skip |

## テスト結果

- `mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts` → 全 green
- `bash scripts/verify-hook-integrity.sh` → `OK: lefthook.yml integrity verified`（exit 0）
- `bash scripts/hooks/lefthook-edit-guard.sh`（clean tree）→ exit 0
- `pnpm typecheck` / `pnpm lint` → green

> NON_VISUAL タスクのためスクリーンショットは無し（証跡は focused vitest + shell exit code + grep gate）。

Refs #230

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> `outputs/phase-11/` にスクリーンショット画像は存在しない（NON_VISUAL）。PR 本文にスクリーンショット専用セクションは設けない（CLAUDE.md PR フロー）。

## 13.5 PR 作成コマンド雛形（**実行禁止 — user-gated**）

> 以下は雛形。**本 Phase では実行しない**。ユーザーが「PR作成」を明示指示した後にのみ実行する。

```bash
# ⚠️ 実行禁止（user-gated）。ユーザー明示指示後にのみ実行する。
gh pr create \
  --base dev \
  --head feat/issue-230-lefthook-edit-guard-spec \
  --title "feat(issue-230): lefthook.yml 直編集 ack ゲート + 手書き .git/hooks 検知 + CI integrity gate" \
  --body-file <(cat <<'BODY'
（§13.4 の本文骨子をここに展開）
BODY
)
```

## 13.6 user-gated 操作の明示

| 操作 | 状態 | 実行条件 |
|------|------|---------|
| `git add` / `git commit` | **未実行** | ユーザー明示指示後 |
| `git push` | **未実行** | ユーザー明示指示後 |
| `gh pr create --base dev` | **未実行** | ユーザー明示指示後 |
| Issue #230 の close / state 変更 | **未実行**（OPEN 維持） | ユーザー明示指示後（PR は `Refs #230` で close しない） |

> 本サイクルは **implemented_local_runtime_pending**。コード実装とローカル検証は完了済みで、commit / push / PR / issue mutation のみ user-gated で残る。

## 完了条件（Phase 13）

- [ ] PR base = `dev`、タイトル案、本文骨子（Summary / 変更ファイル一覧 / AC 充足表 / テスト結果 / `Refs #230`）が定義されている
- [ ] commit / push / PR / issue close がすべて user-gated であり、本 Phase では実行しないと明記されている
- [ ] `gh pr create --base dev` の雛形コマンドに実行禁止の注記が付いている
- [ ] NON_VISUAL のためスクリーンショット専用セクションを設けないことが明記されている
- [ ] Issue #230 は OPEN 維持・PR 文脈は `Refs #230`（`Closes` ではない）であることが明記されている
