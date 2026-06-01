# Phase 2: 設計 — issue-230-lefthook-edit-guard

> 後続実装が「何をどのファイルにどう書くか」迷わない粒度で、対象ファイル・シグネチャ・入出力・副作用を定義する（CONST_005）。

## 2.1 変更対象ファイル一覧

| # | パス | 種別 | 役割 |
|---|------|------|------|
| 1 | `scripts/hooks/lefthook-edit-guard.sh` | 新規 | pre-commit guard 本体（R-1 local / R-2 / R-3 / R-4） |
| 2 | `scripts/verify-hook-integrity.sh` | 新規 | lefthook.yml ↔ scripts/hooks 参照整合 + tracked stray hook 検知（local/CI 共用） |
| 3 | `.github/workflows/verify-hook-integrity.yml` | 新規 | CI gate（push/PR → main, dev） |
| 4 | `lefthook.yml` | 編集 | `pre-commit.commands.lefthook-edit-guard` 追加 |
| 5 | `scripts/hooks/__tests__/lefthook-edit-guard.spec.ts` | 新規 | guard の fixture テスト（invariant #8） |
| 6 | `scripts/__tests__/verify-hook-integrity.spec.ts` | 新規 | integrity script の fixture テスト |
| 7 | `docs/00-getting-started-manual/lefthook-operations.md` | 編集 | 新 guard の運用節を追記（AC-3 リンク先） |
| 8 | `CLAUDE.md` | 編集 | 「Git hook の方針」節に guard / CI gate の存在を追記（AC-3 アンカー） |

> ディレクトリ `scripts/hooks/__tests__/` は新規作成。`scripts/__tests__/` は既存有無を実装時に確認し無ければ作成。

## 2.2 `scripts/hooks/lefthook-edit-guard.sh`（#1）設計

### シェル構造・関数シグネチャ

```bash
#!/usr/bin/env bash
# pre-commit: lefthook.yml 直編集 ack ゲート + 手書き .git/hooks 検知
# 正本: lefthook.yml / docs/00-getting-started-manual/lefthook-operations.md
# 方針: CLAUDE.md「Git hook の方針」
set -euo pipefail

# --- 0. sync-merge 等は skip（AC-4: false positive 抑制） ---
git_dir="$(git rev-parse --git-dir)"
for marker in MERGE_HEAD REBASE_HEAD CHERRY_PICK_HEAD REVERT_HEAD; do
  [ -e "$git_dir/$marker" ] && exit 0
done

# --- 1. lefthook.yml 直編集 ack ゲート（R-2 / R-3） ---
#   staged 対象に lefthook.yml が含まれ、LEFTHOOK_EDIT_ACK!=1 なら fail
staged_lefthook="$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^lefthook\.yml$' || true)"
if [ -n "$staged_lefthook" ] && [ "${LEFTHOOK_EDIT_ACK:-}" != "1" ]; then
  print_lefthook_edit_block   # AC-3 メッセージ
  exit 1
fi

# --- 2. 手書き .git/hooks 検知（R-1 local / R-4） ---
#   .git/hooks/ 配下で *.sample でも lefthook 署名でもないファイルを offender とする
hooks_dir="$git_dir/hooks"
offenders=""
if [ -d "$hooks_dir" ]; then
  while IFS= read -r f; do
    case "$f" in *.sample) continue;; esac
    grep -qiE 'LEFTHOOK|lefthook' "$f" 2>/dev/null && continue   # managed → 除外（AC-4）
    offenders="${offenders}${f}\n"
  done < <(find "$hooks_dir" -maxdepth 1 -type f)
fi
if [ -n "$offenders" ]; then
  print_handwritten_hook_block "$offenders"   # AC-3 メッセージ
  exit 1
fi

exit 0
```

### 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | staged diff（`git diff --cached`）、`.git/hooks/` の実ファイル、env `LEFTHOOK_EDIT_ACK` |
| 出力 | exit code（0=pass / 1=block）、stderr/stdout のメッセージ |
| 副作用 | **なし**（read-only。ファイル変更・stage 変更しない） |
| メッセージ要件（R-3） | `LEFTHOOK_EDIT_ACK=1` 通過方法、`CLAUDE.md`「Git hook の方針」、`docs/00-getting-started-manual/lefthook-operations.md` を必ず含む |

## 2.3 `scripts/verify-hook-integrity.sh`（#2）設計

```bash
#!/usr/bin/env bash
# lefthook.yml ↔ scripts/hooks 整合 + tracked stray hook 検知（local / CI 共用）
set -euo pipefail
fail=0

# A. lefthook.yml が参照する `bash scripts/hooks/*.sh` の実在検証
#    `run: bash scripts/<...>.sh` / `run: node scripts/<...>.mjs` を抽出し existsを確認
refs="$(grep -oE 'run:[[:space:]]*(bash|node)[[:space:]]+[^[:space:]]+' lefthook.yml | awk '{print $NF}' || true)"
while IFS= read -r p; do
  [ -z "$p" ] && continue
  if [ ! -f "$p" ]; then echo "::error::lefthook.yml references missing script: $p"; fail=1; fi
done <<< "$refs"

# B. tracked stray hook 検知: git 管理下に commit された実行可能 hook 影（forbidden）
#    例: トラッキングされた `hooks/` shadow ディレクトリや *.hook
stray="$(git ls-files | grep -E '(^|/)hooks/(pre-commit|pre-push|commit-msg|post-merge)(\.|$)' || true)"
if [ -n "$stray" ]; then echo "::error::tracked stray git-hook shadow files detected:"; echo "$stray"; fail=1; fi

# C. lefthook.yml 構造健全性: min_version 行の存在
grep -qE '^min_version:' lefthook.yml || { echo "::error::lefthook.yml missing min_version"; fail=1; }

[ "$fail" -eq 0 ] && echo "OK: lefthook.yml integrity verified"
exit "$fail"
```

### 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `lefthook.yml`、`git ls-files`、`scripts/hooks/*` の実在 |
| 出力 | exit code（0=ok / 1=fail）、`::error::` 行（GitHub Actions annotation） |
| 副作用 | なし（read-only） |

## 2.4 `.github/workflows/verify-hook-integrity.yml`（#3）設計

`verify-test-suffix.yml` を踏襲。`on: push/pull_request: [main, dev]`、`permissions: contents: read`、`concurrency` group、`runs-on: ubuntu-latest`、step は `actions/checkout@v4`（fetch-depth: 1）→ `bash scripts/verify-hook-integrity.sh`。

## 2.5 `lefthook.yml`（#4）編集

`pre-commit.commands` 末尾に追加:

```yaml
    lefthook-edit-guard:
      run: bash scripts/hooks/lefthook-edit-guard.sh
      stage_fixed: false
      fail_text: |
        🚫 lefthook.yml の直編集 / 手書き .git/hooks を検知しました。
        lefthook.yml を意図的に編集する場合: LEFTHOOK_EDIT_ACK=1 git commit ...
        方針: CLAUDE.md「Git hook の方針」
        詳細: docs/00-getting-started-manual/lefthook-operations.md
```

> 既存 `pre-commit.parallel: true` と整合（read-only guard なので並列安全）。

## 2.6 テスト設計（#5 / #6）

`scripts/coverage-guard.spec.ts` パターン（一時 git repo を mkdtemp → `git init` → fixture stage → `execFileSync('bash', [script])` で exit code / stdout 検証）を踏襲。詳細は Phase 4。

## 2.7 ローカル実行・検証コマンド

```bash
# guard 単体
bash scripts/hooks/lefthook-edit-guard.sh; echo "exit=$?"
# integrity 単体
bash scripts/verify-hook-integrity.sh; echo "exit=$?"
# focused tests
mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 2.8 完了条件（Phase 2）

- 8 ファイルの変更種別・シグネチャ・入出力・副作用を定義（完了）
- guard / integrity の shell 構造を疑似コードで確定（完了）
- ローカル検証コマンドを列挙（完了）
