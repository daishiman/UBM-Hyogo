# Phase 5: 実装 — issue-230-lefthook-edit-guard

> **[実装区分: 実装仕様書 / NON_VISUAL]**
> Phase 2 設計 + Phase 3 補正（§3.4）を正本に、8 ファイルそれぞれを「後続実装者がそのまま書ける粒度」で具体化する。
> Phase 4 で定義した spec（LG-a〜LG-g / VI-a〜VI-d）を GREEN にすることが本 Phase のゴール。

## 5.1 実装対象ファイル（再掲）

| # | パス | 種別 | Task |
|---|------|------|------|
| 1 | `scripts/hooks/lefthook-edit-guard.sh` | 新規 | A |
| 2 | `scripts/verify-hook-integrity.sh` | 新規 | B |
| 3 | `.github/workflows/verify-hook-integrity.yml` | 新規 | B |
| 4 | `lefthook.yml` | 編集 | A |
| 5 | `scripts/hooks/__tests__/lefthook-edit-guard.spec.ts` | 新規（Phase 4） | A |
| 6 | `scripts/__tests__/verify-hook-integrity.spec.ts` | 新規（Phase 4） | B |
| 7 | `docs/00-getting-started-manual/lefthook-operations.md` | 編集 | C |
| 8 | `CLAUDE.md` | 編集 | C |

> Task A/B は独立並列。Task C は A/B 確定後（参照先・env 名・script パス確定後）に追記する。

---

## 5.2 #1 `scripts/hooks/lefthook-edit-guard.sh`（Task A）

**役割**: pre-commit guard 本体。`lefthook.yml` 直編集の ack ゲート（R-2 / R-3）と手書き `.git/hooks/*` 検知（R-1 local / R-4）。
**入力**: staged diff（`git diff --cached`）、`.git/hooks/` 実ファイル、env `LEFTHOOK_EDIT_ACK`。
**出力**: exit code（0=pass / 1=block）、stdout のメッセージ。
**副作用**: なし（read-only。ファイル / stage を変更しない）。
**エラーハンドリング**: `set -euo pipefail` 下で `grep` の非ゼロ終了が script を落とさないよう、検知系 `grep` は `|| true`（Phase 3 §3.4-2）。

### 完全疑似コード（Phase 3 補正反映版）

```bash
#!/usr/bin/env bash
# pre-commit: lefthook.yml 直編集 ack ゲート + 手書き .git/hooks 検知
# 正本: lefthook.yml / docs/00-getting-started-manual/lefthook-operations.md
# 方針: CLAUDE.md「Git hook の方針」
set -euo pipefail

# §3.4-1 補正: worktree でも共有 hooks dir を正しく解決するため --git-common-dir を使う
common_dir="$(git rev-parse --git-common-dir)"

# --- 0. sync-merge / rebase / cherry-pick / revert 中は skip（R-4 false positive 抑制） ---
for marker in MERGE_HEAD REBASE_HEAD CHERRY_PICK_HEAD REVERT_HEAD; do
  if [ -e "$common_dir/$marker" ]; then
    exit 0
  fi
done

# メッセージ関数（R-3: ack 方法 + CLAUDE.md + lefthook-operations.md を必ず含む）
print_lefthook_edit_block() {
  echo ""
  echo "🚫 [pre-commit] lefthook.yml の直編集を検知しました。"
  echo ""
  echo "  lefthook.yml は Git hook の唯一の正本です（CLAUDE.md「Git hook の方針」）。"
  echo "  意図的に編集する場合のみ、明示 ack を付けて commit してください:"
  echo ""
  echo "    LEFTHOOK_EDIT_ACK=1 git commit ..."
  echo ""
  echo "  方針: CLAUDE.md「Git hook の方針」"
  echo "  詳細: docs/00-getting-started-manual/lefthook-operations.md"
  echo ""
}

print_handwritten_hook_block() {
  echo ""
  echo "🚫 [pre-commit] 手書き .git/hooks ファイルを検知しました。"
  echo ""
  echo "  Git hook は lefthook.yml を唯一の正本とします（CLAUDE.md「Git hook の方針」）。"
  echo "  .git/hooks/* の手書きは禁止です。lefthook.yml の commands を編集し、"
  echo "  pnpm install（prepare → lefthook install）で再配置してください。"
  echo ""
  echo "  検知したファイル:"
  printf '%b' "$1"
  echo ""
  echo "  方針: CLAUDE.md「Git hook の方針」"
  echo "  詳細: docs/00-getting-started-manual/lefthook-operations.md"
  echo ""
}

# --- 1. lefthook.yml 直編集 ack ゲート（R-2 / R-3） ---
staged_lefthook="$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^lefthook\.yml$' || true)"
if [ -n "$staged_lefthook" ] && [ "${LEFTHOOK_EDIT_ACK:-}" != "1" ]; then
  print_lefthook_edit_block
  exit 1
fi

# --- 2. 手書き .git/hooks 検知（R-1 local / R-4） ---
hooks_dir="$common_dir/hooks"
offenders=""
if [ -d "$hooks_dir" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in
      *.sample) continue ;;     # R-4: lefthook install が触らない sample は除外
    esac
    # R-4: lefthook 注入署名（LEFTHOOK / lefthook）を含む managed hook は除外
    if grep -qiE 'LEFTHOOK|lefthook' "$f" 2>/dev/null; then
      continue
    fi
    offenders="${offenders}    - ${f}\n"
  done < <(find "$hooks_dir" -maxdepth 1 -type f)
fi
if [ -n "$offenders" ]; then
  print_handwritten_hook_block "$offenders"
  exit 1
fi

exit 0
```

### 実装メモ
- `git rev-parse --git-common-dir` は相対パスを返す場合がある（`.git`）。`cwd` がリポジトリルートでない場合に備え、必要なら `cd "$(git rev-parse --show-toplevel)"` を先頭に置くか、`common_dir` を絶対化（`common_dir="$(cd "$common_dir" && pwd)"`）してもよい。pre-commit は通常リポジトリルートで実行されるため、最小実装では相対のままでも `.sample` 除外・marker 検知は動作する。Phase 6 で worktree ケースを補強する。
- offender 累積は process substitution（`done < <(find ...)`）で親シェル変数を保持する（pipe `|` だとサブシェルで `offenders` が失われる）。

---

## 5.3 #2 `scripts/verify-hook-integrity.sh`（Task B）

**役割**: `lefthook.yml` ↔ `scripts/hooks` の参照整合 + 構造健全性 + tracked stray hook 検知（local / CI 共用）。
**入力**: `lefthook.yml`、`git ls-files`、参照先 script の実在。
**出力**: exit code（0=ok / 1=fail）、`::error::` 行（GitHub Actions annotation）。
**副作用**: なし（read-only）。
**エラーハンドリング**: 各検査で `fail=1` を立て、最後に `exit "$fail"`。`grep` は `|| true`。

### 完全疑似コード（Phase 3 §3.4-3 補正: 第2トークン抽出）

```bash
#!/usr/bin/env bash
# lefthook.yml ↔ scripts/hooks 整合 + tracked stray hook 検知（local / CI 共用）
set -euo pipefail
fail=0

# A. lefthook.yml が参照する `run: bash|node <script>` の <script>（第2トークン）実在検証
#    §3.4-3: awk '{print $NF}' は引数付き run 行で誤検出するため、第2トークン（runword の次）を抽出する。
#    `run: bash scripts/hooks/foo.sh --flag` → scripts/hooks/foo.sh を抽出（--flag は無視）
refs="$(grep -E 'run:[[:space:]]*(bash|node)[[:space:]]+' lefthook.yml \
  | sed -E 's/.*run:[[:space:]]*(bash|node)[[:space:]]+([^[:space:]]+).*/\2/' \
  || true)"
while IFS= read -r p; do
  [ -z "$p" ] && continue
  if [ ! -f "$p" ]; then
    echo "::error::lefthook.yml references missing script: $p"
    fail=1
  fi
done <<< "$refs"

# B. tracked stray git-hook shadow 検知（git 管理下に commit された hook 影は禁止）
stray="$(git ls-files | grep -E '(^|/)hooks/(pre-commit|pre-push|commit-msg|post-merge|post-checkout|prepare-commit-msg)(\.|$)' || true)"
if [ -n "$stray" ]; then
  echo "::error::tracked stray git-hook shadow files detected:"
  echo "$stray"
  fail=1
fi

# C. lefthook.yml 構造健全性: min_version 行の存在
if ! grep -qE '^min_version:' lefthook.yml; then
  echo "::error::lefthook.yml missing min_version"
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "OK: lefthook.yml integrity verified"
fi
exit "$fail"
```

### 実装メモ
- 第2トークン抽出の `sed` 正規表現は `run:` の後の runword（`bash`/`node`）と、それに続く非空白トークン 1 個（=script path）を `\2` に取る。引数（`--flag` 等）は `.*` で読み捨てられる。
- 検査 A の `grep` が 0 件のとき `refs` は空 → `while` は空入力で何もしない（`<<< ""` は 1 回空行を渡すが `[ -z "$p" ] && continue` で skip）。
- 検査 B の stray パターンは `git ls-files` の相対パス前提。`hooks/pre-commit`（先頭）と `apps/x/hooks/pre-commit`（途中）の両方を `(^|/)hooks/` で捕捉する。

---

## 5.4 #3 `.github/workflows/verify-hook-integrity.yml`（Task B）

**役割**: CI gate。push / PR（main, dev）で integrity script を hard gate 実行（R-1 の CI 観測面）。
`verify-test-suffix.yml` を踏襲。`permissions: contents: read` 最小権限（不変条件 #4）。

### 全体

```yaml
# 目的: lefthook.yml が hook の唯一の正本である状態を CI で恒久保持する gate
# 検証: lefthook.yml が参照する scripts/hooks/*.sh の実在 + tracked stray hook 不在 + min_version 健全性
# 正本: lefthook.yml / docs/00-getting-started-manual/lefthook-operations.md
# 関連 Issue: #230
name: verify-hook-integrity

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

permissions:
  contents: read

concurrency:
  group: verify-hook-integrity-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify-hook-integrity:
    name: verify-hook-integrity
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Verify lefthook.yml integrity
        run: bash scripts/verify-hook-integrity.sh
```

### 実装メモ
- `continue-on-error` を付けない hard gate（`coverage-guard.spec.ts` の CI gate 検証パターンに倣う）。
- `fetch-depth: 1` で十分（`git ls-files` は checkout 済み tree を参照）。

---

## 5.5 #4 `lefthook.yml`（Task A 編集）

**役割**: pre-commit に `lefthook-edit-guard` command を追加。
`pre-commit.commands` 末尾（`block-stable-key-update` の後）に以下ブロックを追加する。

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

### 実装メモ
- 既存 `pre-commit.parallel: true` と整合（read-only guard なので並列安全）。
- `verify-hook-integrity.sh` は pre-commit には足さない（CI gate 専用 + 必要時手動実行）。pre-commit を重くしないため。
- インデントは既存 commands（2 階層ネスト = 4 スペース）に合わせる。

---

## 5.6 #5 / #6 spec ファイル（Phase 4 で定義済）

Phase 4 のケース表（LG-a〜LG-g / VI-a〜VI-d）どおりに実装する。本 Phase では「実装した script が当該 spec を GREEN にする」ことを確認する。

---

## 5.7 #7 `docs/00-getting-started-manual/lefthook-operations.md`（Task C 編集）

**役割**: 新 guard の運用節を追記（AC-3 リンク先）。
追記する節の骨子（見出しは既存ドキュメントのスタイルに合わせる）:

```markdown
## lefthook-edit-guard / verify-hook-integrity（hook 正本逸脱の検知）

Git hook は lefthook.yml を唯一の正本とする。逸脱 drift を機械検知するため、
以下 2 つの guard を設けている（Issue #230）。

### lefthook-edit-guard（pre-commit / local）
- 実体: scripts/hooks/lefthook-edit-guard.sh
- lefthook.yml を stage した commit を block する。意図的編集は次で通す:

      LEFTHOOK_EDIT_ACK=1 git commit ...

- 手書き .git/hooks/*（lefthook 署名 / *.sample を除く）を検知して block する。
- merge / rebase / cherry-pick / revert 中は自動 skip（false positive 抑制）。

### verify-hook-integrity（CI / scripts/verify-hook-integrity.sh）
- lefthook.yml が参照する scripts/hooks/*.sh の実在を検証。
- tracked stray hook（hooks/pre-commit 等の commit 影）を検知。
- min_version 行の存在を検証。
- CI gate: .github/workflows/verify-hook-integrity.yml（push / PR → main, dev）。
- 手動実行: bash scripts/verify-hook-integrity.sh
```

### 実装メモ
- 既存ドキュメントの末尾 or hook 一覧節の近くに追記。既存アンカー（`#skill-indexes-drift-gate` 等）と重複しない見出し ID を使う。

---

## 5.8 #8 `CLAUDE.md`（Task C 編集）

**役割**: 「Git hook の方針」節（`> **Git hook の方針**: ...` の段落付近）に、guard / CI gate の存在を 1〜2 行追記（AC-3 アンカー）。

追記文面の骨子:

```markdown
> lefthook.yml の直編集と手書き `.git/hooks/*` は `lefthook-edit-guard`（pre-commit）が
> 検知して block する。意図的に lefthook.yml を編集する場合のみ `LEFTHOOK_EDIT_ACK=1 git commit ...`。
> CI 側は `verify-hook-integrity`（`.github/workflows/verify-hook-integrity.yml`）が
> lefthook.yml ↔ scripts/hooks 参照整合 + tracked stray hook 不在を gate 化する。
> 詳細: docs/00-getting-started-manual/lefthook-operations.md
```

### 実装メモ
- 既存の「`.git/hooks/*` の手書きは禁止」の直後に挿入し、機械強制が存在することを明示する。
- 文面のリンク先（`lefthook-operations.md`）は #7 の追記節と整合させる。

---

## 5.9 ローカル検証コマンド

```bash
bash scripts/hooks/lefthook-edit-guard.sh; echo "exit=$?"
bash scripts/verify-hook-integrity.sh; echo "exit=$?"
mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 完了条件（Phase 5）

- 8 ファイルすべてについて「何を書くか」が後続実装者が迷わない粒度（疑似コード / YAML ブロック / 追記文面骨子）で記述されている。
- guard / integrity 疑似コードに Phase 3 補正（`git rev-parse --git-common-dir`、第2トークン抽出、`set -e` 下 `grep || true`）が反映されている。
- 各ファイルの入力・出力・副作用・エラーハンドリングが明記されている。
- Phase 4 spec（LG-a〜LG-g / VI-a〜VI-d）が GREEN になる実装内容になっている。
