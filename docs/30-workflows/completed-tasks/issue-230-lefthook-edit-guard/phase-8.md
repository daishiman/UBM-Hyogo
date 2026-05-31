# Phase 8: リファクタリング — issue-230-lefthook-edit-guard

> Phase 5-7 で green を確認した実装を、可読性・DRY の観点で整理する。
> 方針: **過剰な抽象化を避け、共通化は 2 script（`lefthook-edit-guard.sh` / `verify-hook-integrity.sh`）に閉じる**。
> 共有ライブラリ化・新規 util ファイル作成は本サイクルでは行わない（YAGNI / CONST_007）。

## 8.1 リファクタリングの基本方針

| 原則 | 適用 |
|------|------|
| DRY（重複排除） | 両 script で重複するメッセージ出力・git ディレクトリ解決を、各 script 内のローカル関数として整理する（ファイル横断の共有 lib は作らない） |
| SRP | guard = 「commit 時の正本逸脱検知」、integrity = 「lefthook.yml ↔ scripts 参照整合 + tracked stray 検知」。責務境界を維持し相互に import しない |
| 過剰抽象化の回避 | 共通 helper を切り出すための 3 本目の `.sh`（例: `hook-lib.sh`）は作らない。共有点が 2 関数程度では抽象化コストが利益を上回る |
| shellcheck 準拠 | `set -euo pipefail` / 変数 quoting / `local` 宣言 / SC2086 等を全行で満たす |

## 8.2 共通化候補とその扱い

Phase 5 実装で両 script に現れる共通パターンを洗い出し、**各 script 内のローカル関数**として整理する（ファイル横断共有はしない）。

### 候補 1: メッセージ出力関数

`lefthook-edit-guard.sh` は AC-3 を満たす 2 種の block メッセージ（lefthook.yml 直編集 / 手書き hook 検知）を出力する。これを **関数として冒頭に定義**し、本体ロジックから呼び出す形へ整理する。

```bash
# guard 内ローカル関数（例）
print_policy_footer() {
  # AC-3: 全 block メッセージ末尾で共通の導線を出力
  cat >&2 <<'EOF'
方針: CLAUDE.md「Git hook の方針」
詳細: docs/00-getting-started-manual/lefthook-operations.md
EOF
}

print_lefthook_edit_block() {
  cat >&2 <<'EOF'
🚫 lefthook.yml の直編集を検知しました。
意図的に編集する場合: LEFTHOOK_EDIT_ACK=1 git commit ...
EOF
  print_policy_footer
}

print_handwritten_hook_block() {
  printf '🚫 lefthook 非管理の手書き .git/hooks を検知しました:\n%b' "$1" >&2
  print_policy_footer
}
```

| 整理ポイント | 内容 |
|------------|------|
| AC-3 導線の一元化 | `print_policy_footer` に CLAUDE.md / lefthook-operations.md 導線を 1 箇所へ集約し、両 block メッセージから呼ぶ（文字列重複を排除） |
| 出力先 | block メッセージは `>&2`（stderr）へ統一。テストの stdout/stderr アサーションと整合させる |
| here-doc quoting | `<<'EOF'`（シングルクォート）で変数展開を抑止し、`$`・絵文字を literal 出力する |

### 候補 2: git-common-dir 解決の共通 helper

Phase 3.4-1 の補正により、guard は worktree 差異を吸収するため `git rev-parse --git-common-dir` を使う。この解決を **guard 内のローカル関数** に切り出し可読性を上げる。

```bash
resolve_git_common_dir() {
  # worktree でも共有 hooks ディレクトリを正しく指す（Phase 3.4-1 補正）
  git rev-parse --git-common-dir
}
```

> integrity script（`verify-hook-integrity.sh`）は `.git/hooks` を参照しないため、この helper は **guard 側のみ**に閉じる。両 script で共有しない（共有 lib を作らない方針）。

### 候補 3: skip 判定（merge/rebase/cherry-pick/revert）

AC-4 の sync-merge skip 判定を関数化し、本体の早期 return を読みやすくする。

```bash
in_special_git_state() {
  local common_dir; common_dir="$(resolve_git_common_dir)"
  local marker
  for marker in MERGE_HEAD REBASE_HEAD CHERRY_PICK_HEAD REVERT_HEAD; do
    [ -e "$common_dir/$marker" ] && return 0
  done
  return 1
}
```

> 既存 `scripts/hooks/staged-task-dir-guard.sh` の skip 条件と整合（CLAUDE.md「sync-merge 時の hook 挙動」）。

## 8.3 可読性・DRY の指針（実装時チェック）

| 項目 | 指針 |
|------|------|
| 関数化 | 「メッセージ出力」「git-common-dir 解決」「special state 判定」をローカル関数へ。本体は逐次フロー（skip 判定 → lefthook.yml ack → 手書き hook 検知）が一読で追える構造にする |
| 早期 return | special git state は最初に `in_special_git_state && exit 0` で抜け、ネストを浅く保つ |
| マジック文字列 | 検知パターン（`^lefthook\.yml$`、`*.sample`、`LEFTHOOK`）はコメントで意図を明記。env 名 `LEFTHOOK_EDIT_ACK` は 1 箇所参照 |
| integrity の参照抽出 | Phase 3.4-3 補正どおり「`run:` 行の第 2 トークン（スクリプトパス）抽出」で、`--changed` 等の引数を誤検出しない正規表現に保つ |

## 8.4 shellcheck 準拠チェックリスト

| 規約 | 内容 |
|------|------|
| `set -euo pipefail` | 両 script 冒頭に必須（不変条件 #3） |
| 変数 quoting | すべての変数参照を `"$var"` でクォート（SC2086 回避）。`find` 結果ループは `while IFS= read -r` を使用 |
| `local` 宣言 | 関数内変数は `local` で宣言しスコープ汚染を防ぐ |
| `set -e` 下の非ゼロ許容 | `grep` / `git diff` の no-match 非ゼロ終了は `|| true` で握り、誤って commit を落とさない（Phase 3.4-2 補正） |
| サブシェル変数 | `offenders` 累積は `done < <(...)`（process substitution）で親シェル変数を保持する（Phase 3.4-2） |
| read-only 維持 | リファクタ後もファイル変更・stage 変更を一切行わない（Phase 2 副作用「なし」を維持） |

## 8.5 リファクタリングで変えないもの（契約維持）

- guard / integrity の **exit code 契約**（0=pass / 1=block・fail）は Phase 4 テストの正本。変更しない。
- AC-3 メッセージに含む必須文字列（`LEFTHOOK_EDIT_ACK=1`、`CLAUDE.md`「Git hook の方針」、`docs/00-getting-started-manual/lefthook-operations.md`）は grep assertion 対象。リファクタで欠落させない。
- script の責務境界（guard ↔ integrity を相互 import しない）を維持する。

## 完了条件（Phase 8）

- [ ] メッセージ出力・git-common-dir 解決・special state 判定を各 script 内ローカル関数へ整理し、本体フローが一読で追える構造になっている
- [ ] AC-3 導線文字列が `print_policy_footer` 1 箇所に集約され、重複が排除されている
- [ ] 共有 lib（3 本目の `.sh`）を新設しておらず、共通化が 2 script に閉じている（過剰抽象化なし）
- [ ] 両 script が `set -euo pipefail` + 全変数 quoting + `local` 宣言で shellcheck 準拠している
- [ ] exit code 契約・AC-3 必須文字列・責務境界がリファクタ前後で不変（Phase 5-7 の green を再実行で維持）
